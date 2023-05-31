import axios from 'axios'
import { Lease } from '../types'
import Config from '../../../common/config'

const tenantsContractsServiceUrl = Config.tenantsContractsService.url

const getLease = async (leaseId: string): Promise<Lease> => {
  const leaseResponse = await axios(
    tenantsContractsServiceUrl + '/leases/' + leaseId
  )

  return leaseResponse.data.data.lease
}

export { getLease }
