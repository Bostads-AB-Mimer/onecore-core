import {
  ParkingSpace,
  ParkingSpaceApplicationCategory,
  ParkingSpaceType,
} from 'onecore-types'
import * as propertyManagementAdapter from '../../../adapters/property-management-adapter'
import * as leasingAdapter from '../../../adapters/leasing-adapter'
import { ProcessStatus } from '../../../common/types'
import * as parkingProcesses from '../index'

const mockedParkingSpace: ParkingSpace = {
  parkingSpaceId: '123-456-789/0',
  address: {
    street: 'Gatan',
    number: '1',
    postalCode: '12345',
    city: 'Västerås',
  },
  rent: {
    currentRent: {
      currentRent: 123,
      vat: 0,
      rentStartDate: undefined,
      rentEndDate: undefined,
      additionalChargeAmount: undefined,
      additionalChargeDescription: undefined,
    },
    futureRents: undefined,
  },
  type: ParkingSpaceType.Garage,
  applicationCategory: ParkingSpaceApplicationCategory.external,
  vacantFrom: new Date(),
}

describe('parkingspaces', () => {
  describe('createLeaseForExternalParkingSpace', () => {
    it('gets the parking space', async () => {
      const getParkingSpaceSpy = jest
        .spyOn(propertyManagementAdapter, 'getParkingSpace')
        .mockResolvedValue(mockedParkingSpace)

      await parkingProcesses.createLeaseForExternalParkingSpace('foo', 'bar')

      expect(getParkingSpaceSpy).toHaveBeenCalledWith('foo')
    })

    it('returns an error if parking space is could not be found', async () => {
      jest
        .spyOn(propertyManagementAdapter, 'getParkingSpace')
        .mockResolvedValue(undefined)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('returns an error if parking space is not external', async () => {
      const internalParkingSpace = {
        ...mockedParkingSpace,
        applicationCategory: ParkingSpaceApplicationCategory.internal,
      }
      jest
        .spyOn(propertyManagementAdapter, 'getParkingSpace')
        .mockResolvedValue(internalParkingSpace)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(400)
    })

    it('gets the applicant contact', async () => {
      jest
        .spyOn(propertyManagementAdapter, 'getParkingSpace')
        .mockResolvedValue(mockedParkingSpace)

      const getContactSpy = jest.spyOn(leasingAdapter, 'getContact')

      await parkingProcesses.createLeaseForExternalParkingSpace('foo', 'bar')

      expect(getContactSpy).toHaveBeenCalledWith('bar')
    })
  })
})
