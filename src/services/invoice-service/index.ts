import KoaRouter from '@koa/router'
import { processInvoiceDataFile } from '../../processes/invoices'

export const routes = (router: KoaRouter) => {
  router.post('(.*)/invoices/process-excel', async (ctx) => {
    try {
      const invoiceRowsExcelFile = ctx.request.files?.['excelData']

      if (invoiceRowsExcelFile && !Array.isArray(invoiceRowsExcelFile)) {
        const result = processInvoiceDataFile(invoiceRowsExcelFile.filepath)
        ctx.status = 200
        ctx.body = result
      }
    } catch (error: any) {
      console.error('Error', error)
      ctx.status = 500
      ctx.body = {
        message: error.message,
      }
    }
  })
}
