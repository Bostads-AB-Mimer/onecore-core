import { logger } from 'onecore-utilities'
import config from '../common/config'
import fs from 'fs/promises'
import { sep } from 'node:path'
import {
  processInvoiceDataFile,
  getBatchContactsCsv,
  getBatchAggregatedRowsCsv,
  getBatchLedgerRowsCsv,
} from '../services/invoice-service/service'

const companies = ['001', '006']

const importRentalInvoicesScript = async () => {
  logger.info('Checking for new rental invoices file')
  const files = await fs.readdir(
    config.economyService.rentalInvoiceImportDirectory
  )

  const excelFileNames = files.filter((file) => {
    return file.endsWith('.xlsx')
  })

  for (const excelFileName of excelFileNames) {
    for (const companyId of companies) {
      logger.info({ excelFileName, companyId }, 'Creating batch for file')
      const result = await processInvoiceDataFile(
        `${config.economyService.rentalInvoiceImportDirectory}${sep}${excelFileName}`,
        companyId
      )
      const batchId = result.batchId

      logger.info(
        { excelFileName, companyId },
        'Getting contact file for batch'
      )
      const contactsCsv = await getBatchContactsCsv(batchId)
      await fs.writeFile(
        `${config.economyService.rentalInvoiceExportDirectory}${sep}${batchId}-${companyId}-contacts.csv`,
        contactsCsv
      )

      logger.info(
        { excelFileName, companyId },
        'Getting aggregate file for batch'
      )
      const aggregatedCsv = await getBatchAggregatedRowsCsv(batchId)
      await fs.writeFile(
        `${config.economyService.rentalInvoiceExportDirectory}${sep}${batchId}-${companyId}-aggregated.csv`,
        aggregatedCsv
      )

      logger.info({ excelFileName, companyId }, 'Getting ledger file for batch')
      const ledgerCsv = await getBatchLedgerRowsCsv(batchId)
      await fs.writeFile(
        `${config.economyService.rentalInvoiceExportDirectory}${sep}${batchId}-${companyId}-ledger.csv`,
        ledgerCsv
      )

      // TODO: Mark invoices as processed
    }

    // TODO: Rename import file to mark as processed.
    logger.info(
      { excelFileName },
      'Finished processing file, renaming to mark as processed'
    )
    fs.rename(
      `${config.economyService.rentalInvoiceImportDirectory}${sep}${excelFileName}`,
      `${config.economyService.rentalInvoiceImportDirectory}${sep}${excelFileName}`.replace(
        '.xlsx',
        '.xlsx-imported'
      )
    )
  }
}

importRentalInvoicesScript()
