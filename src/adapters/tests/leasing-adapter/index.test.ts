import { HttpStatusCode } from 'axios'
import assert from 'node:assert'
import nock from 'nock'

import config from '../../../common/config'
import * as leasingAdapter from '../../leasing-adapter'
import {
  mockedInvoices,
  mockedOldProblematicInvoices,
  mockedProblematicInvoices,
} from './mocks'
import * as factory from '../../../../test/factories'

describe('leasing-adapter', () => {
  describe(leasingAdapter.getInternalCreditInformation, () => {
    it('returns true if no problematic invoices', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/contact\/invoices\/contactCode/)
        .reply(200, { content: mockedInvoices })

      const result =
        await leasingAdapter.getInternalCreditInformation('P123456')

      expect(result).toBe(true)
    })

    it('returns false if current problematic invoices', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/contact\/invoices\/contactCode/)
        .reply(200, { content: mockedProblematicInvoices })

      const result =
        await leasingAdapter.getInternalCreditInformation('P123456')

      expect(result).toBe(false)
    })

    it('returns true if old problematic invoices', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/contact\/invoices\/contactCode/)
        .reply(200, { content: mockedOldProblematicInvoices })

      const result =
        await leasingAdapter.getInternalCreditInformation('P123456')

      expect(result).toBe(true)
    })
  })

  describe(leasingAdapter.getWaitingList, () => {
    it('should return waiting list', async () => {
      const waitingList = factory.waitingList.build()
      nock(config.tenantsLeasesService.url)
        .get(/contact\/waitingList\//)
        .reply(200, { content: [waitingList] })

      const result = await leasingAdapter.getWaitingList('P123456')

      expect(result).toEqual([
        {
          ...waitingList,
          contractFromApartment:
            waitingList.contractFromApartment.toISOString(),
          waitingListFrom: waitingList.waitingListFrom.toISOString(),
        },
      ])
    })
  })

  describe(leasingAdapter.getDetailedApplicantsByListingId, () => {
    it('should return detailed applicants by listing id', async () => {
      const detailedApplicants = factory.detailedApplicant.buildList(1)
      nock(config.tenantsLeasesService.url)
        .get(/listing/)
        .reply(200, { content: detailedApplicants })

      const result = await leasingAdapter.getDetailedApplicantsByListingId(1337)
      assert(result.ok)

      expect(result.data).toEqual([
        expect.objectContaining({ id: detailedApplicants[0].id }),
      ])
    })
  })

  describe(leasingAdapter.addApplicantToWaitingList, () => {
    it('should add applicant to waiting list', async () => {
      nock(config.tenantsLeasesService.url)
        .post(/contact\/waitingList/)
        .reply(201)

      const result = await leasingAdapter.addApplicantToWaitingList(
        '´196709226789',
        'P123456',
        'Bilplats (intern)'
      )

      expect(result.status).toEqual(HttpStatusCode.Created)
    })
  })

  describe(leasingAdapter.resetWaitingList, () => {
    it('should reset waiting list for applicant', async () => {
      nock(config.tenantsLeasesService.url)
        .post(/contact\/waitingList/)
        .reply(200)

      const result = await leasingAdapter.resetWaitingList(
        '´196709226789',
        'P123456',
        'Bilplats (intern)'
      )

      expect(result.ok).toEqual(true)
    })

    it('should return not-in-waiting-list when applicant not in waiting list', async () => {
      nock(config.tenantsLeasesService.url)
        .post(/contact\/waitingList/)
        .reply(404)

      const result = await leasingAdapter.resetWaitingList(
        '´196709226789',
        'P123456',
        'Bilplats (intern)'
      )

      expect(result.ok).toEqual(false)
      if (!result.ok) expect(result.err).toBe('not-in-waiting-list')
    })

    it('should return unknown on unknown error from leasing', async () => {
      nock(config.tenantsLeasesService.url)
        .post(/contact\/waitingList/)
        .reply(500)

      const result = await leasingAdapter.resetWaitingList(
        '´196709226789',
        'P123456',
        'Bilplats (intern)'
      )

      expect(result.ok).toEqual(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })
  })

  describe(leasingAdapter.validateResidentialAreaRentalRules, () => {
    it('calls leasing and parses a passing validation result', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/applicants\/validateResidentialAreaRentalRules/)
        .reply(200, { applicationType: 'Replace' })

      const result = await leasingAdapter.validateResidentialAreaRentalRules(
        '123',
        'ABC'
      )

      expect(result.ok).toBe(true)
    })

    it('calls leasing and returns an error', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/applicants\/validateResidentialAreaRentalRules/)
        .reply(400, { reason: 'some-reason' })

      const result = await leasingAdapter.validateResidentialAreaRentalRules(
        '123',
        'ABC'
      )

      expect(result).toMatchObject({ ok: false, err: { tag: 'unknown' } })
    })
  })

  describe(leasingAdapter.validatePropertyRentalRules, () => {
    it('calls leasing and parses a passing validation result', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/applicants\/validatePropertyRentalRules/)
        .reply(200, { applicationType: 'Replace' })

      const result = await leasingAdapter.validatePropertyRentalRules(
        '123',
        'ABC'
      )

      expect(result.ok).toBe(true)
    })

    it('calls leasing and returns an error', async () => {
      nock(config.tenantsLeasesService.url)
        .get(/applicants\/validatePropertyRentalRules/)
        .reply(403, { reason: 'some-other-reason' })

      const result = await leasingAdapter.validatePropertyRentalRules(
        '123',
        'ABC'
      )

      expect(result).toMatchObject({
        ok: false,
        err: { tag: 'not-tenant-in-the-property' },
      })
    })
  })
})