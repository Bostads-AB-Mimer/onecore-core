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

const getTenantStatusForPnr = async (
  nationalRegistrationNumber: string
): Promise<{ isTenant: boolean, address?: string, leaseIds?: string[] }> => {
  const tenantStatusResponse = await axios(tenantsLeasesServiceUrl + '/leases/tenant-status/' + nationalRegistrationNumber);
  return tenantStatusResponse.data.data;
};


export { getLease, getLeasesForPnr, getContactForPnr, getTenantStatusForPnr }
