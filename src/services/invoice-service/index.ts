import KoaRouter from '@koa/router'
import { getBatchAggregatedRows } from './adapters/economy-adapter'
import { logger } from 'onecore-utilities'
import { getInvoicesForContact } from '../../adapters/leasing-adapter'
import {
  getBatchAggregatedRowsCsv,
  getBatchContactsCsv,
  getBatchLedgerRowsCsv,
  processInvoiceDataFile,
} from './service'

export const routes = (router: KoaRouter) => {
  router.post('(.*)/invoices/batches/:companyId', async (ctx) => {
    try {
      // Mimer company, ie "001" = Mimer AB, "006" = Björnklockan AB
      const companyId = ctx.params.companyId
      const invoiceRowsExcelFile = ctx.request.files?.['excelData']

      if (invoiceRowsExcelFile && !Array.isArray(invoiceRowsExcelFile)) {
        const result = await processInvoiceDataFile(
          invoiceRowsExcelFile.filepath,
          companyId
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
    try {
      const contactsCsv = await getBatchContactsCsv(
        ctx.params.batchId as string
      )
      ctx.status = 200
      ctx.response.type = 'text/plain'
      ctx.body = contactsCsv
    } catch (error: unknown) {
      ctx.status = 500
      ctx.body = { error }
    }
  })

  router.get('(.*)/invoices/batches/:batchId/aggregated-rows', async (ctx) => {
    try {
      ctx.request.socket.setTimeout(0)
      const transactionRowsCsv = await getBatchAggregatedRowsCsv(
        ctx.params.batchId as string
      )

      ctx.status = 200
      ctx.response.type = 'text/plain'
      ctx.body = transactionRowsCsv
    } catch (error: unknown) {
      ctx.status = 500
      ctx.body = { error }
    }
  })

  router.get('(.*)/invoices/batches/:batchId/ledger-rows', async (ctx) => {
    try {
      ctx.request.socket.setTimeout(0)
      const transactionRowsCsv = await getBatchLedgerRowsCsv(
        ctx.params.batchId as string
      )

      ctx.status = 200
      ctx.response.type = 'text/plain'
      ctx.body = transactionRowsCsv
    } catch (error: unknown) {
      ctx.status = 500
      ctx.body = { error }
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
