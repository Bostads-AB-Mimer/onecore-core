import { LeaseStatus } from 'onecore-types'

import { calculateResidenceStatus } from '../calculate-residence-status'
import * as factory from '../../../../test/factories'

describe(calculateResidenceStatus, () => {
  it('returns "LEASED" when lease status is "Current"', () => {
    const leases = [factory.lease.build({ status: LeaseStatus.Current })]
    const status = calculateResidenceStatus(leases)
    expect(status).toBe('LEASED')
  })

  it('returns "VACANT" when lease status is "Terminated"', () => {
    const leases = [factory.lease.build({ status: LeaseStatus.Ended })]
    const status = calculateResidenceStatus(leases)
    expect(status).toBe('VACANT')
  })
})
