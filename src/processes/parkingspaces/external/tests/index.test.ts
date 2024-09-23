import axios from 'axios'
jest.mock('onecore-utilities', () => {
  return {
    logger: {
      info: () => {
        return
      },
      error: () => {
        return
      },
    },
    loggedAxios: axios,
    axiosTypes: axios,
  }
})

import {
  ConsumerReport,
  Contact,
  ParkingSpace,
  ParkingSpaceApplicationCategory,
} from 'onecore-types'
import * as propertyManagementAdapter from '../../../../adapters/property-management-adapter'
import * as leasingAdapter from '../../../../adapters/leasing-adapter'
import * as communcationAdapter from '../../../../adapters/communication-adapter'
import { ProcessStatus } from '../../../../common/types'
import * as parkingProcesses from '../index'
import {
  mockedParkingSpace,
  successfulConsumerReport,
  failedConsumerReport,
  mockedLease,
  mockedApplicantWithoutLeases,
  mockedApplicantWithLeases,
  mockedApplicantWithoutAddress,
} from './index.mocks'
import { AdapterResult } from '../../../../adapters/types'

describe('parkingspaces', () => {
  describe('createLeaseForExternalParkingSpace', () => {
    let getParkingSpaceSpy: jest.SpyInstance<
      Promise<ParkingSpace | undefined>,
      [parkingSpaceId: string],
      any
    >
    let getContactSpy: jest.SpyInstance<
      Promise<AdapterResult<Contact, 'not-found' | 'unknown'>>,
      [contactId: string],
      any
    >
    let getCreditInformationSpy: jest.SpyInstance<
      Promise<ConsumerReport>,
      [nationalRegistrationNumber: string],
      any
    >
    let getInternalCreditInformationSpy: jest.SpyInstance<
      Promise<boolean>,
      [contactCode: string],
      any
    >
    let sendNotificationToContactSpy: jest.SpyInstance<
      Promise<any>,
      [recipientContact: Contact, subject: string, message: string],
      any
    >
    let sendNotificationToRoleSpy: jest.SpyInstance<
      Promise<any>,
      [recipientRole: string, subject: string, message: string],
      any
    >
    let createContractSpy: jest.SpyInstance<
      Promise<any>,
      [
        objectId: string,
        contactId: string,
        fromDate: string,
        companyCode: string,
      ],
      any
    >

    beforeEach(() => {
      getParkingSpaceSpy = jest
        .spyOn(propertyManagementAdapter, 'getParkingSpace')
        .mockResolvedValue(mockedParkingSpace)
      getContactSpy = jest
        .spyOn(leasingAdapter, 'getContact')
        .mockResolvedValue({ ok: true, data: mockedApplicantWithoutLeases })
      getCreditInformationSpy = jest
        .spyOn(leasingAdapter, 'getCreditInformation')
        .mockResolvedValue(successfulConsumerReport)
      getInternalCreditInformationSpy = jest
        .spyOn(leasingAdapter, 'getInternalCreditInformation')
        .mockResolvedValue(false)
      sendNotificationToContactSpy = jest
        .spyOn(communcationAdapter, 'sendNotificationToContact')
        .mockResolvedValue({})
      sendNotificationToRoleSpy = jest
        .spyOn(communcationAdapter, 'sendNotificationToRole')
        .mockResolvedValue({})
      createContractSpy = jest
        .spyOn(leasingAdapter, 'createLease')
        .mockResolvedValue(mockedLease)
    })

    it('gets the parking space', async () => {
      getParkingSpaceSpy.mockReset()

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(getParkingSpaceSpy).toHaveBeenCalledWith('foo')
    })

    it('returns an error if parking space is could not be found', async () => {
      getParkingSpaceSpy.mockResolvedValue(undefined)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('returns an error if parking space is not external', async () => {
      const internalParkingSpace = {
        ...mockedParkingSpace,
        applicationCategory: ParkingSpaceApplicationCategory.internal,
      }
      getParkingSpaceSpy.mockResolvedValue(internalParkingSpace)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('gets the applicant contact', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(getContactSpy).toHaveBeenCalledWith('bar')
    })

    it('returns an error if the applicant contact could not be retrieved', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue({ ok: false, err: 'unknown' })

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('returns an error if the applicant has no address', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue(mockedApplicantWithoutAddress)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('performs an external credit check if applicant has no contracts', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue({
        ok: true,
        data: mockedApplicantWithoutLeases,
      })

      getCreditInformationSpy
        .mockReset()
        .mockResolvedValue(successfulConsumerReport)

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(getCreditInformationSpy).toHaveBeenCalledWith('1212121212')
    })

    it('fails lease creation if external credit check fails', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getCreditInformationSpy.mockResolvedValue(failedConsumerReport)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(400)
    })

    it('sends a notification to the applicant if external credit check fails', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getCreditInformationSpy.mockResolvedValue(failedConsumerReport)
      sendNotificationToContactSpy.mockReset()

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(sendNotificationToContactSpy).toHaveBeenCalledWith(
        expect.anything(),
        'Nekad ansökan om extern bilplats',
        expect.any(String)
      )
    })

    it('sends a notification to the role leasing if external credit check fails', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getCreditInformationSpy.mockResolvedValue(failedConsumerReport)
      sendNotificationToRoleSpy.mockReset()

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(sendNotificationToRoleSpy).toHaveBeenCalledWith(
        'leasing',
        'Nekad ansökan om extern bilplats',
        expect.any(String)
      )
    })

    it('performs an internal credit check if applicant has leases', async () => {
      getContactSpy.mockResolvedValue({
        ok: true,
        data: mockedApplicantWithLeases,
      })
      getInternalCreditInformationSpy.mockReset()
      getCreditInformationSpy.mockReset()

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(getInternalCreditInformationSpy).toHaveBeenCalledWith(
        mockedApplicantWithLeases.contactCode
      )
      expect(getCreditInformationSpy).not.toHaveBeenCalled()
    })

    it('fails lease creation if internal credit check fails', async () => {
      getContactSpy.mockResolvedValue({
        ok: true,
        data: mockedApplicantWithLeases,
      })
      getInternalCreditInformationSpy.mockResolvedValue(false)

      const result = await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(400)
    })

    it('creates a contract if external credit check succeeds', async () => {
      createContractSpy.mockReset()

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(createContractSpy).toHaveBeenCalledWith(
        mockedParkingSpace.parkingSpaceId,
        mockedApplicantWithLeases.contactCode,
        expect.any(String),
        '001'
      )
    })

    it('does not create a contract if external credit check fails', async () => {
      createContractSpy.mockReset()
      getContactSpy
        .mockReset()
        .mockResolvedValue({ ok: true, data: mockedApplicantWithoutLeases })
      getCreditInformationSpy
        .mockReset()
        .mockResolvedValue(failedConsumerReport)
      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(createContractSpy).not.toHaveBeenCalledWith()
    })

    it('creates a contract if internal credit check succeeds', async () => {
      createContractSpy.mockReset()

      getContactSpy.mockResolvedValue({
        ok: true,
        data: mockedApplicantWithLeases,
      })
      getInternalCreditInformationSpy.mockReset().mockResolvedValue(true)
      getCreditInformationSpy.mockReset()

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(createContractSpy).toHaveBeenCalledWith(
        mockedParkingSpace.parkingSpaceId,
        mockedApplicantWithLeases.contactCode,
        expect.any(String),
        '001'
      )
    })

    it('does not create a contract if internal credit check fails', async () => {
      createContractSpy.mockReset()
      getContactSpy.mockResolvedValue({
        ok: true,
        data: mockedApplicantWithLeases,
      })
      getInternalCreditInformationSpy.mockReset().mockResolvedValue(false)

      await parkingProcesses.createLeaseForExternalParkingSpace(
        'foo',
        'bar',
        '2034-04-21'
      )

      expect(createContractSpy).not.toHaveBeenCalledWith()
    })
  })
})
