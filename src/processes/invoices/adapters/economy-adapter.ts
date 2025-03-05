import { loggedAxios as axios } from 'onecore-utilities'
import config from '../../../common/config'
import { InvoiceDataRow } from '../types'
import { Contact } from 'onecore-types'
import { AdapterResult } from '../../../adapters/types'

export const createInvoiceBatch = async () => {
  const axiosOptions = {
    method: 'POST',
  }

  const result = await axios(
    config.economyService.url + '/invoice-data/create-batch',
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
    config.economyService.url + '/invoice-data/enrich-invoice-data-rows',
    axiosOptions
  )

  return result.data
}

export const saveInvoiceContactsToDb = async (
  contacts: Contact[],
  batchId: string
) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      contacts,
      batchId,
    },
  }

  const result = await axios(
    config.economyService.url + '/invoice-data/save-contacts',
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
    config.economyService.url + '/invoice-data/update-contacts',
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
    config.economyService.url + '/invoice-data/update-invoices',
    axiosOptions
  )

  return result.data
}
