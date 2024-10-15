import { HttpStatusCode } from 'axios'
import assert from 'node:assert'
import nock from 'nock'
import config from '../../common/config'
import * as leasingAdapter from '../leasing-adapter'
import {
  mockedInvoices,
  mockedOldProblematicInvoices,
  mockedProblematicInvoices,
  mockedWaitingList,
} from './leasing-adapter.mocks'
import * as factory from '../../../test/factories'
import { OfferStatus } from 'onecore-types'

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
      nock(config.tenantsLeasesService.url)
        .get(/contact\/waitingList\//)
        .reply(200, { content: mockedWaitingList })

      const result = await leasingAdapter.getWaitingList('P123456')

      expect(result).toEqual(
        mockedWaitingList.map((v) => ({
          ...v,
          contractFromApartment: v.contractFromApartment.toISOString(),
          waitingListFrom: v.waitingListFrom.toISOString(),
        }))
      )
    })
  })

  describe(leasingAdapter.getListingByIdWithDetailedApplicants, () => {
    it('should return a listing with detailed applicants', async () => {
      const detailedApplicants = factory.detailedApplicant.buildList(1)
      nock(config.tenantsLeasesService.url)
        .get(/listing/)
        .reply(200, { content: detailedApplicants })

      const result =
        await leasingAdapter.getListingByIdWithDetailedApplicants('1337')

      expect(result).toEqual([
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

  describe(leasingAdapter.createOffer, () => {
    it('should try to create an offer', async () => {
      nock(config.tenantsLeasesService.url)
        .post('/offer')
        .reply(201, { content: { id: 1 } })

      const result = await leasingAdapter.createOffer({
        expiresAt: new Date(),
        listingId: 1,
        applicantId: 1,
        selectedApplicants: [],
        status: 1,
      })
      assert(result.ok)

      expect(result.data).toEqual({ id: 1 })
    })
  })

  describe(leasingAdapter.getOfferByOfferId, () => {
    it('should try to get offer', async () => {
      nock(config.tenantsLeasesService.url)
        .get('/offers/123')
        .reply(200, {
          content: factory.detailedOffer.build({
            id: 123,
            status: OfferStatus.Active,
            listingId: 456,
          }),
        })

      const res = await leasingAdapter.getOfferByOfferId(123)

      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.listingId).toBe(456)
        expect(res.data.status).toBe(OfferStatus.Active)
        expect(res.data.id).toBe(123)
      }
    })
    it('should return 404 on not found', async () => {
      nock(config.tenantsLeasesService.url)
        .get('/offers/123')
        .reply(404, {
          content: {
            ok: false,
            err: 'not-found',
          },
        })

      const res = await leasingAdapter.getOfferByOfferId(123)

      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.err).toBe('not-found')
    })
  })

  describe(leasingAdapter.getOffersForContact, () => {
    it('should try to get offers', async () => {
      const offer = factory.offerWithRentalObjectCode.build()
      nock(config.tenantsLeasesService.url)
        .get('/contacts/P174965/offers')
        .reply(200, {
          content: [offer],
        })

      const result = await leasingAdapter.getOffersForContact('P174965')
      assert(result.ok)
      expect(result.data).toEqual([expect.objectContaining({ id: offer.id })])
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
