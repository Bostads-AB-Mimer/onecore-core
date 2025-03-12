import {
  createInvoiceBatch,
  enrichInvoiceDataRows,
  saveInvoiceContactsToDb,
  updateContactsFromDb,
  updateInvoicesFromDb,
} from './adapters/economy-adapter'
import { excelFileToInvoiceDataRows } from './adapters/excel-adapter'
import { getContactsByContactCodes } from '../../adapters/leasing-adapter'
import { ProcessResult, ProcessStatus } from '../../common/types'
import { logger } from 'onecore-utilities'

export const processInvoiceDataFile = async (
  invoiceDataFileName: string
): Promise<ProcessResult<unknown, unknown>> => {
  const log: string[] = [
    `Behandling av aviseringsunderlag`,
    `Tidpunkt för behandling: ${new Date()}`,
  ]

  try {
    const invoiceDataRows =
      await excelFileToInvoiceDataRows(invoiceDataFileName)
    log.push(`Läste in ${invoiceDataRows.length} excelrader`)

    const batchId = await createInvoiceBatch()

    log.push(`Skapade ny batch: ${batchId}`)
    logger.info(`Created new batch: ${batchId}`)

    const CHUNK_SIZE = 100

    let chunkNum = 0
    let success = true

    while (chunkNum * CHUNK_SIZE < 2000 /*invoiceDataRows.length*/) {
      logger.info(
        'Processing rows',
        chunkNum * CHUNK_SIZE,
        (chunkNum + 1) * CHUNK_SIZE - 1
      )
      const contactCodes = await enrichInvoiceDataRows(
        invoiceDataRows.slice(
          chunkNum * CHUNK_SIZE,
          (chunkNum + 1) * CHUNK_SIZE - 1
        ),
        batchId
      )

      const contacts = await getContactsByContactCodes(contactCodes)

      if (contacts.ok) {
        const result = await saveInvoiceContactsToDb(contacts.data, batchId)
      }

      chunkNum++
    }

    const updateContactResult = await updateContactsFromDb(batchId)
    const updateInvoicesResult = await updateInvoicesFromDb(batchId)

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 200,
      data: {
        processedRows: invoiceDataRows.length,
        log,
        updateInvoices: {
          contacts: {
            successfulContacts: updateContactResult.content.successfulContacts,
            failedContacts: updateContactResult.content.failedContacts,
            errors: updateContactResult.content.errors,
          },
          aggregatedRows: {
            successfulRows:
              updateInvoicesResult.content.aggregatedRows?.successfulRows,
            failedRows: updateInvoicesResult.content.aggregatedRows?.failedRows,
            errors: updateInvoicesResult.content.aggregatedRows?.errors,
          },
          customerLedgers: {
            successfulLedgers:
              updateInvoicesResult.content.customerLedgers?.successfulLedgers,
            failedLedgers:
              updateInvoicesResult.content.customerLedgers?.failedLedgers,
            errors: updateInvoicesResult.content.customerLedgers?.errors,
          },
        },
      },
    }
    /*return {
      processStatus: ProcessStatus.successful,
      httpStatus: 200,
      data: {},
    }*/
  } catch (error: any) {
    logger.error(
      error,
      'Error processing invoice data file - batch could not be created'
    )

    return {
      processStatus: ProcessStatus.failed,
      error: 'invoice-data-batch-not-created',
      httpStatus: 500,
      response: {
        message: `Invoice data batch could not be created.`,
      },
    }
  }
}
