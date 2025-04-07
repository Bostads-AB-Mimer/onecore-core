import KoaRouter from '@koa/router'
import { excelFileToInvoiceDataRows } from './adapters/excel-adapter'
import {
  createInvoiceBatch,
  enrichInvoiceDataRows,
  saveInvoiceContactsToDb,
  getBatchContacts,
  getBatchAggregatedRows,
  getBatchLedgerRows,
} from './adapters/economy-adapter'
import { logger } from 'onecore-utilities'
import {
  getContactsByContactCodes,
  getInvoicesForContact,
} from '../../adapters/leasing-adapter'
import { InvoiceDataRow } from './types'
import { Contact } from 'onecore-types'

export const getContactFromInvoiceRows = (
  contactCode: string,
  invoiceDataRows: InvoiceDataRow[]
): Contact | null => {
  const invoiceRow = invoiceDataRows.find((row) => {
    return (row.contactCode as string) === contactCode
  })

  if (!invoiceRow) {
    logger.error({ contactCode }, 'Could not find contact in invoiceDataRows')
    return null
  }

  return {
    contactCode: invoiceRow.contactCode as string,
    address: {
      street: invoiceRow.rentalObjectName as string,
      city: 'Västerås',
      postalCode: '',
      number: '',
    },
    contactKey: '',
    firstName: '',
    lastName: '',
    fullName: invoiceRow.tenantName as string,
    nationalRegistrationNumber: '',
    isTenant: true,
    phoneNumbers: [],
    birthDate: new Date(),
  }
}

export const processInvoiceDataFile = async (
  invoiceDataFileName: string,
  invoiceDate: string,
  invoiceDueDate: string
): Promise<{ batchId: string; errors: string[] }> => {
  try {
    const errors: string[] = []
    const CHUNK_SIZE = 1000

    const invoiceDataRows =
      await excelFileToInvoiceDataRows(invoiceDataFileName)

    let chunkNum = 0
    const batchId = await createInvoiceBatch()
    logger.info(`Created new batch: ${batchId}`)

    while (CHUNK_SIZE * chunkNum < invoiceDataRows.length) {
      const startNum = chunkNum * CHUNK_SIZE
      const endNum = Math.min(
        (chunkNum + 1) * CHUNK_SIZE,
        invoiceDataRows.length
      )
      const currentInvoiceDataRows = invoiceDataRows.slice(startNum, endNum)
      logger.info(
        { startNum, endNum, totalrows: currentInvoiceDataRows.length },
        'Processing rows'
      )
      const contactCodes = await enrichInvoiceDataRows(
        currentInvoiceDataRows,
        batchId,
        invoiceDate,
        invoiceDueDate
      )

      const contacts = await getContactsByContactCodes(contactCodes)
      if (contacts.ok) {
        if (contacts.data.errors) {
          for (const errorContactCode of contacts.data.errors) {
            // Fallback to info in excel file.
            const errorContact = getContactFromInvoiceRows(
              errorContactCode,
              currentInvoiceDataRows
            )

            if (errorContact) {
              contacts.data.contacts.push(errorContact)
              logger.info(`Using invoice data for contact ${errorContact}`)
            } else {
              errors.push(errorContactCode)
            }
          }
        }
        await saveInvoiceContactsToDb(contacts.data.contacts, batchId)
      }

      chunkNum++
    }

    return {
      batchId,
      errors,
    }
  } catch (error: any) {
    logger.error(
      error,
      'Error processing invoice data file - batch could not be created'
    )

    throw error
  }
}

const transformDate = (value: string | number) => {
  if (value == undefined || typeof value === 'number' || value === '') {
    return ''
  }
  return (value as string).replaceAll('-', '')
}

export const routes = (router: KoaRouter) => {
  router.post('(.*)/invoices/batches', async (ctx) => {
    try {
      const invoiceRowsExcelFile = ctx.request.files?.['excelData']
      const invoiceDate = ctx.request.body.invoiceDate
      const invoiceDueDate = ctx.request.body.invoiceDueDate

      if (invoiceRowsExcelFile && !Array.isArray(invoiceRowsExcelFile)) {
        const result = await processInvoiceDataFile(
          invoiceRowsExcelFile.filepath,
          invoiceDate,
          invoiceDueDate
        )
        ctx.status = 200
        ctx.body = result
      }
    } catch (error: any) {
      logger.error(error, 'Error creating invoice data batch from excel file')
      ctx.status = 500
      ctx.body = {
        message: error.message,
      }
    }
  })

  router.get('(.*)/invoices/by-contact-code/:contactCode', async (ctx) => {
    const contactCode = ctx.params.contactCode as string

    const invoices = await getInvoicesForContact(contactCode)

    if (invoices.ok && invoices.data.length > 0) {
      ctx.status = 200
      ctx.body = {
        content: invoices.data,
      }
    } else {
      ctx.status = 404
      ctx.body = {}
    }
  })

  router.get('(.*)/invoices/batches/:batchId/contacts', async (ctx) => {
    const contacts = await getBatchContacts(ctx.params.batchId as string)

    if (contacts.ok) {
      const csvContent: string[] = []

      csvContent.push(
        'Code;Description;Company No;Email;Street Address;Zip Code;City;Invoice Delivery Method;GL Object Value 5;Group'
      )

      contacts.data.forEach((contact) => {
        csvContent.push(
          `${contact.code};${contact.description};${contact.companyNo};${contact.email};${contact.streetAddress};${contact.zipCode};${contact.city};${contact.invoiceDeliveryMethod};${contact.counterPart};`
        )
      })

      ctx.status = 200
      ctx.response.type = 'text/plain'
      ctx.body = csvContent.join('\n')
    } else {
      ctx.status = 500
      ctx.body = ''
    }
  })

  router.get('(.*)/invoices/batches/:batchId/aggregated-rows', async (ctx) => {
    ctx.request.socket.setTimeout(0)
    const transactionRows = await getBatchAggregatedRows(
      ctx.params.batchId as string
    )

    if (transactionRows.ok) {
      const csvContent: string[] = []

      csvContent.push(
        'Voucher Type;Voucher No;Voucher Date;Account;Posting 1;Posting 2;Posting 3;Posting 4;Posting 5;Period Start;No of Periods;Subledger No;Invoice Date;Invoice No;OCR;Due Date;Text;TaxRule;Amount'
      )

      transactionRows.data.forEach((transactionRow) => {
        csvContent.push(
          `${transactionRow.voucherType};${transactionRow.voucherNo};${transformDate(transactionRow.voucherDate)};${transactionRow.account};${transactionRow.posting1};${transactionRow.posting2};${transactionRow.posting3};${transactionRow.posting4};${transactionRow.posting5};${transformDate(transactionRow.periodStart)};${transactionRow.noOfPeriods};${transactionRow.subledgerNo};${transformDate(transactionRow.invoiceDate)};${transactionRow.invoiceNo};${transactionRow.ocr};${transformDate(transactionRow.dueDate)};${transactionRow.text};${transactionRow.taxRule};${transactionRow.amount}`
        )
      })

      ctx.status = 200
      ctx.response.type = 'text/plain'
      ctx.body = csvContent.join('\n')
    } else {
      ctx.status = 500
      ctx.body = ''
    }
  })

  router.get('(.*)/invoices/batches/:batchId/ledger-rows', async (ctx) => {
    ctx.request.socket.setTimeout(0)
    const transactionRows = await getBatchLedgerRows(
      ctx.params.batchId as string
    )

    if (transactionRows.ok) {
      const csvContent: string[] = []

      csvContent.push(
        'Voucher Type;Voucher No;Voucher Date;Account;Posting 1;Posting 2;Posting 3;Posting 4;Posting 5;Period Start;No of Periods;Subledger No;Invoice Date;Invoice No;OCR;Due Date;Text;TaxRule;Amount'
      )

      transactionRows.data.forEach((transactionRow) => {
        csvContent.push(
          `${transactionRow.voucherType};${transactionRow.voucherNo};${transformDate(transactionRow.voucherDate)};${transactionRow.account};${transactionRow.posting1};${transactionRow.posting2};${transactionRow.posting3};${transactionRow.posting4};${transactionRow.posting5};${transformDate(transactionRow.periodStart)};${transactionRow.noOfPeriods};${transactionRow.subledgerNo};${transformDate(transactionRow.invoiceDate)};${transactionRow.invoiceNo};${transactionRow.ocr};${transformDate(transactionRow.dueDate)};${transactionRow.text};${transactionRow.taxRule};${transactionRow.amount}`
        )
      })

      ctx.status = 200
      ctx.response.type = 'text/plain'
      ctx.body = csvContent.join('\n')
    } else {
      ctx.status = 500
      ctx.body = ''
    }
  })

  router.get('(.*)/invoices/batches/:batchId/accounts', async (ctx) => {
    const transactionRows = await getBatchAggregatedRows(
      ctx.params.batchId as string
    )

    if (transactionRows.ok) {
      const accounts = transactionRows.data.reduce(
        (acc: Record<string, number>, transactionRow) => {
          if (!acc[transactionRow.account]) {
            acc[transactionRow.account] = 0
          }

          acc[transactionRow.account] =
            (acc[transactionRow.account] as number) +
            (transactionRow.amount as number)

          acc['totalBalance'] += transactionRow.amount as number

          return acc
        },
        { totalBalance: 0 }
      )

      ctx.status = 200
      ctx.body = {
        content: accounts,
      }
    } else {
      ctx.status = 500
      ctx.body = ''
    }
  })
}
