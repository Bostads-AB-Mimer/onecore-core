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
import { HttpStatusCode, InternalAxiosRequestConfig } from 'axios'

describe('parkingspaces', () => {
  describe('createNoteOfInterestForInternalParkingSpace', () => {
    // Mock out all top level functions, such as get, put, delete and post:
    jest.mock('axios')

    const getParkingSpaceSpy = jest.spyOn(
      propertyManagementAdapter,
      'getPublishedParkingSpace'
    )

    const getContactSpy = jest.spyOn(leasingAdapter, 'getContact')
    const getLeasesForPnrSpy = jest.spyOn(leasingAdapter, 'getLeasesForPnr')
    const getWaitingListSpy = jest.spyOn(leasingAdapter, 'getWaitingList')
    const applyForListingSpy = jest.spyOn(leasingAdapter, 'applyForListing')
    const addApplicantToWaitingListSpy = jest.spyOn(
      leasingAdapter,
      'addApplicantToWaitingList'
    )
    const getListingByRentalObjectCodeSpy = jest.spyOn(
      leasingAdapter,
      'getListingByRentalObjectCode'
    )
    const createNewListingSpy = jest.spyOn(leasingAdapter, 'createNewListing')

    jest.spyOn(leasingAdapter, 'getListingByRentalObjectCode')
    jest.spyOn(leasingAdapter, 'createNewListing')

    it('gets the parking space', async () => {
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(getParkingSpaceSpy).toHaveBeenCalledWith('foo')
    })

    it('returns an error if parking space is could not be found', async () => {
      getParkingSpaceSpy.mockResolvedValueOnce(undefined)

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('returns an forbidden if the applicant is not a tenant', async () => {
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce([])

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(403)
    })

    it('returns an error if parking space is not internal', async () => {
      getParkingSpaceSpy.mockResolvedValueOnce({
        ...mockedParkingSpace,
        waitingListType: 'Bilplats (extern)',
      })

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(400)
    })

    it('gets the applicant contact', async () => {
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(getContactSpy).toHaveBeenCalledWith('bar')
    })

    it('returns an error if the applicant contact could not be retrieved', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue(undefined)

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(404)
    })

    it('adds applicant to internal waiting list if not in it already', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce([
        {
          applicantCaption: 'Foo Bar',
          contactCode: 'P12345',
          contractFromApartment: new Date('2024-02-29T23:00:00.000Z'),
          queuePoints: 45,
          queuePointsSocialConnection: 0,
          waitingListFrom: new Date('2024-01-31T23:00:00.000Z'),
          waitingListTypeCaption: 'Bostad',
        },
      ])
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      addApplicantToWaitingListSpy.mockResolvedValueOnce({} as any)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(addApplicantToWaitingListSpy).toHaveBeenCalledWith(
        '1212121212',
        'P12345',
        'Bilplats (intern)'
      )
    })

    it('adds applicant to external waiting list if not in it already', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce([
        {
          applicantCaption: 'Foo Bar',
          contactCode: 'P12345',
          contractFromApartment: new Date('2024-02-29T23:00:00.000Z'),
          queuePoints: 45,
          queuePointsSocialConnection: 0,
          waitingListFrom: new Date('2024-01-31T23:00:00.000Z'),
          waitingListTypeCaption: 'Bostad',
        },
        {
          applicantCaption: 'Foo Bar',
          contactCode: 'P12345',
          contractFromApartment: new Date('2024-02-29T23:00:00.000Z'),
          queuePoints: 45,
          queuePointsSocialConnection: 0,
          waitingListFrom: new Date('2024-01-31T23:00:00.000Z'),
          waitingListTypeCaption: 'Bilplats (intern)',
        },
      ])
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      addApplicantToWaitingListSpy.mockResolvedValueOnce({} as any)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(addApplicantToWaitingListSpy).toHaveBeenCalledWith(
        '1212121212',
        'P12345',
        'Bilplats (extern)'
      )
    })

    it('calls getListingByRentalObjectCode if applicant passes validation', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(getListingByRentalObjectCodeSpy).toHaveBeenCalledWith('foo')
    })

    it('calls createNewListing if listing not added already', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      getListingByRentalObjectCodeSpy.mockResolvedValueOnce({
        status: HttpStatusCode.NotFound,
        data: {},
        statusText: '',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      })

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(createNewListingSpy).toHaveBeenCalledWith({
        address: 'Svarvargatan 4',
        blockCaption: 'LINDAREN 2',
        blockCode: '1401',
        districtCaption: 'Malmaberg',
        districtCode: 'MAL',
        id: 1,
        monthlyRent: 698.33,
        objectTypeCaption: 'Carport',
        objectTypeCode: 'CPORT',
        publishedFrom: new Date('2024-03-26T09:06:56.000Z'),
        publishedTo: new Date('2024-05-04T21:59:59.000Z'),
        rentalObjectCode: '705-808-00-0006',
        rentalObjectTypeCaption: 'Standard hyresobjektstyp',
        rentalObjectTypeCode: 'STD',
        status: 1,
        vacantFrom: new Date('2023-01-31T23:00:00.000Z'),
        waitingListType: 'Bilplats (intern)',
      })
    })

    it('calls applyForListing if applicant passes validation', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      getListingByRentalObjectCodeSpy.mockResolvedValueOnce({
        status: HttpStatusCode.NotFound,
        data: {},
        statusText: '',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      })

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(applyForListingSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationType: 'baz',
          contactCode: 'P12345',
          id: 0,
          listingId: undefined,
          name: 'Foo Bar',
          status: 1,
        })
      )
    })

    it('returns ProcessStatus.successful when applicant has been created', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      getListingByRentalObjectCodeSpy.mockResolvedValueOnce({
        status: HttpStatusCode.NotFound,
        data: {},
        statusText: '',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      })

      const response =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(response.processStatus).toBe(ProcessStatus.successful)
    })

    it('returns ProcessStatus.inProgress if applicant has an application already', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({
        status: HttpStatusCode.Conflict,
      } as any)
      getListingByRentalObjectCodeSpy.mockResolvedValueOnce({
        status: HttpStatusCode.NotFound,
        data: {},
        statusText: '',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      })

      const response =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(response.processStatus).toBe(ProcessStatus.successful)
    })
  })
})
