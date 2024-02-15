import axios from 'axios'
import { Contact, Lease } from 'onecore-types'
import config from '../../../common/config'

const tenantsLeasesServiceUrl = config.tenantsLeasesService.url

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
    tenantsLeasesServiceUrl + '/leases/for/' + nationalRegistrationNumber
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

const getContact = async (contactId: string): Promise<Contact> => {
  const contactResponse = await axios(
    tenantsLeasesServiceUrl + '/contact/contactCode/' + contactId
  )

  return contactResponse.data.data
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
): Promise<any> => {
  const informationResponse = await axios(
    tenantsLeasesServiceUrl +
      '/cas/getConsumerReport/' +
      nationalRegistrationNumber
  )
  return informationResponse.data.data
}

export {
  getLease,
  getLeasesForPnr,
  getContactForPnr,
  getContact,
  createLease,
  getCreditInformation,
}
