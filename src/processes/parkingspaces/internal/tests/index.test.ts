import {
  Contact,
  Lease,
  ParkingSpace,
  ParkingSpaceApplicationCategory,
  WaitingList,
} from 'onecore-types'
import * as propertyManagementAdapter from '../../../../adapters/property-management-adapter'
import * as leasingAdapter from '../../../../adapters/leasing-adapter'
import { ProcessStatus } from '../../../../common/types'
import * as parkingProcesses from '../index'
import {
  mockedApplicant,
  mockedParkingSpace,
  mockedLeases,
  mockedWaitingList,
} from './index.mocks'
import { create } from 'domain'
import { getLeasesForPnr } from '../../../../adapters/leasing-adapter'
import exp from 'constants'

describe('parkingspaces', () => {
  describe('createLeaseForExternalParkingSpace', () => {
    let getParkingSpaceSpy: jest.SpyInstance<
      Promise<ParkingSpace | undefined>,
      [parkingSpaceId: string],
      any
    >
    let getContactSpy: jest.SpyInstance<
      Promise<Contact | undefined>,
      [contactId: string],
      any
    >
    let getLeasesForPnrSpy: jest.SpyInstance<
      Promise<Lease[] | undefined>,
      [nationalRegistrationNumber: string],
      any
    >
    let getWaitingListSpy: jest.SpyInstance<
      Promise<WaitingList[] | undefined>,
      [nationalRegistrationNumber: string],
      any
    >

    beforeEach(() => {
      getParkingSpaceSpy = jest
        .spyOn(propertyManagementAdapter, 'getPublishedParkingSpace')
        .mockResolvedValue(mockedParkingSpace)
      getContactSpy = jest
        .spyOn(leasingAdapter, 'getContact')
        .mockResolvedValue(mockedApplicant)
      getLeasesForPnrSpy = jest
        .spyOn(leasingAdapter, 'getLeasesForPnr')
        .mockResolvedValue(mockedLeases)
      getWaitingListSpy = jest
        .spyOn(leasingAdapter, 'getWaitingList')
        .mockResolvedValue(mockedWaitingList)
    })

    it('gets the parking space', async () => {
      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar'
      )

      expect(getParkingSpaceSpy).toHaveBeenCalledWith('foo')
    })

    it('returns an error if parking space is could not be found', async () => {
      getParkingSpaceSpy.mockResolvedValue(undefined)

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('returns an forbidden if the applicant is not a tenant', async () => {
      getLeasesForPnrSpy.mockResolvedValue([])
      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar'
        )
      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(403)
    })

    it('returns an error if parking space is not internal', async () => {
      const internalParkingSpace = {
        ...mockedParkingSpace,
        applicationCategory: ParkingSpaceApplicationCategory.external,
      }
      getParkingSpaceSpy.mockResolvedValue(internalParkingSpace)

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(400)
    })

    it('gets the applicant contact', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar'
      )

      expect(getContactSpy).toHaveBeenCalledWith('bar')
    })

    it('returns an error if the applicant contact could not be retrieved', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue(undefined)

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('pass validation if user belongs to waiting list', async () => {
      const logSpy = jest.spyOn(global.console, 'log')
      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar'
      )
      expect(logSpy.mock.calls[0][0].length).toBe(4)
      expect(logSpy.mock.calls[0][0][3]).toEqual(
        'Validering genomförd. Sökande godkänd för att anmäla intresse på bilplats foo'
      )
    })

    it('places applicant in waiting list for internal parking space if applicant does not belong to waiting list', async () => {
      //todo: implement
      console.log('implement')
    })
  })
})
