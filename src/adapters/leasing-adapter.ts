import axios from 'axios'
import {
  ConsumerReport,
  Contact,
  Invoice,
  InvoiceTransactionType,
  Lease,
  WaitingList,
} from 'onecore-types'
import config from '../common/config'
import dayjs from 'dayjs'
import { serialize } from 'v8'

const tenantsLeasesServiceUrl = config.tenantsLeasesService.url //todo: refactor name

const getLease = async (leaseId: string): Promise<Lease> => {
  const leaseResponse = await axios(
    tenantsLeasesServiceUrl + '/leases/' + leaseId
  )

  return leaseResponse.data.data
}

const getLeasesForPnr = async (
  nationalRegistrationNumber: string
): Promise<Lease[]> => {
  const leasesResponse = await axios(
    tenantsLeasesServiceUrl +
      '/leases/for/nationalRegistrationNumber/' +
      nationalRegistrationNumber
  )
  return leasesResponse.data.data
}

const getContactForPnr = async (
  nationalRegistrationNumber: string
): Promise<Contact> => {
  const contactResponse = await axios(
    tenantsLeasesServiceUrl + '/contact/' + nationalRegistrationNumber
  )

  return contactResponse.data.data
}

const getContact = async (contactId: string): Promise<Contact | undefined> => {
  try {
    const contactResponse = await axios(
      tenantsLeasesServiceUrl + '/contact/contactCode/' + contactId
    )

    return contactResponse.data.data
  } catch (error) {
    return undefined
  }
}

const createLease = async (
  objectId: string,
  contactId: string,
  fromDate: string,
  companyCode: string
) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      parkingSpaceId: objectId,
      contactCode: contactId,
      fromDate,
      companyCode,
    },
  }

  const result = await axios(tenantsLeasesServiceUrl + '/leases', axiosOptions)

  return result.data
}

const getCreditInformation = async (
  nationalRegistrationNumber: string
): Promise<ConsumerReport> => {
  const informationResponse = await axios(
    tenantsLeasesServiceUrl +
      '/cas/getConsumerReport/' +
      nationalRegistrationNumber
  )
  return informationResponse.data.data
}

const getInternalCreditInformation = async (
  contactCode: string
): Promise<boolean> => {
  const result = await axios(
    tenantsLeasesServiceUrl + '/contact/invoices/contactCode/' + contactCode
  )

  const invoices = result.data.data as Invoice[] | undefined
  const sixMonthsMs = 1000 * 60 * 60 * 24 * 182

  let hasDebtCollection = false

  if (invoices) {
    hasDebtCollection ||= invoices.some((invoice: Invoice) => {
      return (
        invoice.transactionType ===
          (InvoiceTransactionType.Reminder ||
            InvoiceTransactionType.DebtCollection) &&
        -dayjs(invoice.expirationDate).diff() < sixMonthsMs
      )
    })
  }

  return !hasDebtCollection
}

const getWaitingList = async (
  nationalRegistrationNumber: string
): Promise<WaitingList[]> => {
  const waitingList = await axios(
    tenantsLeasesServiceUrl +
      '/contact/waitingList/' +
      nationalRegistrationNumber
  )
  return waitingList.data.data
}

export {
  getLease,
  getLeasesForPnr,
  getContactForPnr,
  getContact,
  createLease,
  getCreditInformation,
  getInternalCreditInformation,
  getWaitingList,
}
