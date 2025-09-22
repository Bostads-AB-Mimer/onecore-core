import { loggedAxios as axios } from 'onecore-utilities'
import config from '../../../common/config'
import { InvoiceDataRow } from '../types'
import { AdapterResult } from '../../../adapters/types'

export const createInvoiceBatch = async () => {
  const axiosOptions = {
    method: 'POST',
  }

  const result = await axios(
    config.economyService.url + '/invoices/import/batches',
    axiosOptions
  )

  return result.data
}

export const enrichInvoiceDataRows = async (
  invoiceDataRows: InvoiceDataRow[],
  batchId: string
) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      invoiceDataRows,
      batchId,
    },
  }

  const result = await axios(
    config.economyService.url + '/invoices/import/enrich-invoice-data-rows',
    axiosOptions
  )

  return result.data
}

export const saveInvoiceContactsToDb = async (
  contactCodes: string[],
  batchId: string
) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      contactCodes,
      batchId,
    },
  }

  const result = await axios(
    config.economyService.url + '/invoices/import/save-contacts',
    axiosOptions
  )

  return result.data
}

export const updateContactsFromDb = async (batchId: string) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      batchId,
    },
  }

  const result = await axios(
    config.economyService.url + '/invoices/import/update-contacts',
    axiosOptions
  )

  return result.data
}

export const updateInvoicesFromDb = async (batchId: string) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      batchId,
    },
  }

  const result = await axios(
    config.economyService.url + '/invoices/import/update-invoices',
    axiosOptions
  )

  return result.data
}

export const getBatchContacts = async (
  batchId: string
): Promise<AdapterResult<InvoiceDataRow[], 'error'>> => {
  const axiosOptions = {
    method: 'GET',
  }

  const result = await axios(
    config.economyService.url + `/invoices/import/batches/${batchId}/contacts`,
    axiosOptions
  )

  return { ok: true, data: result.data.content }
}

export const getBatchLedgerRows = async (
  batchId: string
): Promise<AdapterResult<InvoiceDataRow[], 'error'>> => {
  const axiosOptions = {
    method: 'GET',
  }

  const result = await axios(
    config.economyService.url +
      `/invoices/import/batches/${batchId}/ledger-rows`,
    axiosOptions
  )

  return { ok: true, data: result.data.content }
}

export const getBatchAggregatedRows = async (
  batchId: string
): Promise<AdapterResult<InvoiceDataRow[], 'error'>> => {
  const axiosOptions = {
    method: 'GET',
  }

  const result = await axios(
    config.economyService.url +
      `/invoices/import/batches/${batchId}/aggregated-rows`,
    axiosOptions
  )

  return { ok: true, data: result.data.content }
}

export const uploadInvoiceFile = async (
  filename: string,
  csvContent: string
): Promise<AdapterResult<InvoiceDataRow[], 'error'>> => {
  const axiosOptions = {
    method: 'POST',
    data: {
      filename,
      fileContents: csvContent,
    },
  }

  const result = await axios(
    config.economyService.url + `/invoices/import/upload-file`,
    axiosOptions
  )

  return { ok: true, data: result.data.content }
}
