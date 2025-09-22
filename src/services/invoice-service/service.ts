import { excelFileToInvoiceDataRows } from './adapters/excel-adapter'
import {
  createInvoiceBatch,
  enrichInvoiceDataRows,
  getBatchAggregatedRows,
  getBatchContacts,
  getBatchLedgerRows,
  saveInvoiceContactsToDb,
  uploadInvoiceFile as uploadInvoiceFileEconomy,
} from './adapters/economy-adapter'
import { InvoiceDataRow } from './types'
import { Contact } from 'onecore-types'
import { logger } from 'onecore-utilities'

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
  companyId: string
): Promise<{
  batchId: string
  errors: { invoiceNumber: string; error: string }[]
}> => {
  try {
    const errors: { invoiceNumber: string; error: string }[] = []
    const CHUNK_SIZE = 500

    const invoiceDataRows = (
      await excelFileToInvoiceDataRows(invoiceDataFileName)
    ).filter((row) => (row.company as string) === companyId)

    console.log(
      'Importing',
      invoiceDataRows.length,
      'rows for company',
      companyId
    )

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
        batchId
      )

      await saveInvoiceContactsToDb(contactCodes.contacts, batchId)

      if (contactCodes.errors && contactCodes.errors.length > 0) {
        errors.push(contactCodes.errors)
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

export const getBatchContactsCsv = async (batchId: string) => {
  const contacts = await getBatchContacts(batchId)

  if (contacts.ok) {
    const csvContent: string[] = []

    csvContent.push(
      'Code;Description;Company No;Email;Street Address;Zip Code;City;Invoice Delivery Method;GL Object Value 5;Group;Collection Code'
    )

    contacts.data.forEach((contact) => {
      csvContent.push(
        `${contact.code};${contact.description};${contact.companyNo};${contact.email};${contact.streetAddress};${contact.zipCode};${contact.city};${contact.invoiceDeliveryMethod};${contact.counterPart};${contact.group};${contact.counterPart ? contact.group : ''}`
      )
    })

    return csvContent.join('\n')
  } else {
    logger.error({ batchId })
    throw new Error(`Could not get contacts for batch ${batchId}`)
  }
}

export const getBatchAggregatedRowsCsv = async (batchId: string) => {
  const transactionRows = await getBatchAggregatedRows(batchId)

  if (transactionRows.ok) {
    const csvContent: string[] = []

    csvContent.push(
      'Voucher Type;Voucher No;Voucher Date;Account;Posting 1;Posting 2;Posting 3;Posting 4;Posting 5;Period Start;No of Periods;Subledger No;Invoice Date;Invoice No;OCR;Due Date;Text;TaxRule;Amount'
    )

    transactionRows.data.forEach((transactionRow) => {
      csvContent.push(
        `${transactionRow.voucherType};${transactionRow.voucherNo};${transformDate(transactionRow.voucherDate)};${transactionRow.account};${transactionRow.posting1 || ''};${transactionRow.posting2 || ''};${transactionRow.posting3 || ''};${transactionRow.posting4 || ''};${transactionRow.posting5 || ''};${transformDate(transactionRow.periodStart)};${transactionRow.noOfPeriods};${transactionRow.subledgerNo};${transformDate(transactionRow.invoiceDate)};${transactionRow.invoiceNo};${transactionRow.ocr};${transformDate(transactionRow.dueDate)};${transactionRow.text};${transactionRow.taxRule};${transactionRow.amount}`
      )
    })

    return csvContent.join('\n')
  } else {
    throw new Error(`Could not get aggregated rows for batch ${batchId}`)
  }
}

export const getBatchLedgerRowsCsv = async (batchId: string) => {
  const transactionRows = await getBatchLedgerRows(batchId)

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

    return csvContent.join('\n')
  } else {
    throw new Error(`Could not get ledger rows for batch ${batchId}`)
  }
}

export const transformDate = (value: string | number) => {
  if (value == undefined || typeof value === 'number' || value === '') {
    return ''
  }
  return (value as string).replaceAll('-', '')
}

export const uploadInvoiceFile = async (
  filename: string,
  csvContent: string
) => {
  await uploadInvoiceFileEconomy(filename, csvContent)
}
