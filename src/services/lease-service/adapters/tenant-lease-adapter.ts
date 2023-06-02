import axios from 'axios'
import { Lease } from '../types'
import Config from '../../../common/config'

const tenantsLeasesServiceUrl = Config.tenantsLeasesService.url

const getLease = async (leaseId: string): Promise<Lease> => {
  const leaseResponse = await axios(
    tenantsLeasesServiceUrl + '/leases/' + leaseId
  )

  return leaseResponse.data.data.lease
}

export { getLease }
