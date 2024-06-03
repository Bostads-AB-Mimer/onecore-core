import axios, {
  AxiosResponse,
  InternalAxiosRequestConfig,
  HttpStatusCode,
} from 'axios'
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
import { mockedListingWithDetailedApplicants } from '../../../../adapters/tests/leasing-adapter.mocks'

const createAxiosResponse = (status: number, data: any): AxiosResponse => {
  return {
    status,
    statusText: 'ok',
    headers: {},
    config: {
      headers: new axios.AxiosHeaders(),
    },
    data,
  }
}

describe('parkingspaces', () => {
  describe('createNoteOfInterestForInternalParkingSpace', () => {
    // Mock out all top level functions, such as get, put, delete and post:
    const getParkingSpaceSpy = jest
      .spyOn(propertyManagementAdapter, 'getPublishedParkingSpace')
      .mockResolvedValue(mockedParkingSpace)
    const getContactSpy = jest
      .spyOn(leasingAdapter, 'getContact')
      .mockResolvedValue(mockedApplicant)
    const getLeasesForPnrSpy = jest
      .spyOn(leasingAdapter, 'getLeasesForPnr')
      .mockResolvedValue(mockedLeases)
    const getInternalCreditInformationSpy = jest
      .spyOn(leasingAdapter, 'getInternalCreditInformation')
      .mockResolvedValue(true)
    const getWaitingListSpy = jest
      .spyOn(leasingAdapter, 'getWaitingList')
      .mockResolvedValue(mockedWaitingList)
    const applyForListingSpy = jest
      .spyOn(leasingAdapter, 'applyForListing')
      .mockResolvedValue(
        createAxiosResponse(axios.HttpStatusCode.Created, null)
      )
    const addApplicantToWaitingListSpy = jest
      .spyOn(leasingAdapter, 'addApplicantToWaitingList')
      .mockResolvedValue(
        createAxiosResponse(axios.HttpStatusCode.Created, null)
      )
    const getListingByRentalObjectCodeSpy = jest
      .spyOn(leasingAdapter, 'getListingByRentalObjectCode')
      .mockResolvedValue(
        createAxiosResponse(
          axios.HttpStatusCode.Ok,
          mockedListingWithDetailedApplicants
        )
      )
    //const getListingByIdSpy = jest.spyOn()
    const createNewListingSpy = jest
      .spyOn(leasingAdapter, 'createNewListing')
      .mockResolvedValue(
        createAxiosResponse(axios.HttpStatusCode.Created, null)
      )

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

    it('returns an error if parking space could not be found', async () => {
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

    it('performs internal credit check', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue(mockedApplicant)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(getInternalCreditInformationSpy).toHaveBeenCalledWith('P12345')
    })

    it('returns an error if credit check fails', async () => {
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getContactSpy.mockResolvedValue(mockedApplicant)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(false)

      const result =
        await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
          'foo',
          'bar',
          'baz'
        )

      expect(result.processStatus).toBe(ProcessStatus.failed)
      expect(result.httpStatus).toBe(400)
    })

    it('adds applicant to internal waiting list if not in it already', async () => {
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)
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
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)
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

    it('gets existing listing if applicant passes validation', async () => {
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)

      await parkingProcesses.createNoteOfInterestForInternalParkingSpace(
        'foo',
        'bar',
        'baz'
      )

      expect(getListingByRentalObjectCodeSpy).toHaveBeenCalledWith('foo')
    })

    it("creates new listing if it hasn't been added already", async () => {
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      getListingByRentalObjectCodeSpy.mockResolvedValueOnce({
        status: axios.HttpStatusCode.NotFound,
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

    it('adds the applicant if the contact/applicant passes validation', async () => {
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)
      getWaitingListSpy.mockResolvedValueOnce(mockedWaitingList)
      applyForListingSpy.mockResolvedValueOnce({ status: 201 } as any)
      getListingByRentalObjectCodeSpy.mockResolvedValueOnce({
        status: axios.HttpStatusCode.NotFound,
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

    it('returns a successful response when applicant has been added', async () => {
      getContactSpy.mockResolvedValue(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValue(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValue(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValue(true)
      getWaitingListSpy.mockResolvedValue(mockedWaitingList)
      applyForListingSpy.mockResolvedValue({ status: 201 } as any)
      createNewListingSpy.mockResolvedValue(
        createAxiosResponse(
          HttpStatusCode.Created,
          mockedListingWithDetailedApplicants
        )
      )
      getListingByRentalObjectCodeSpy.mockResolvedValue({
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
      expect(response.httpStatus).toBe(200)
    })

    it('returns ProcessStatus.inProgress if applicant has an application to this listing already', async () => {
      getContactSpy.mockResolvedValueOnce(mockedApplicant)
      getParkingSpaceSpy.mockResolvedValueOnce(mockedParkingSpace)
      getLeasesForPnrSpy.mockResolvedValueOnce(mockedLeases)
      getInternalCreditInformationSpy.mockResolvedValueOnce(true)
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
