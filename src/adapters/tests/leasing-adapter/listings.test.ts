import nock from 'nock'
import { ListingStatus } from 'onecore-types'

import config from '../../../common/config'
import * as leasingAdapter from '../../leasing-adapter'
import * as factory from '../../../../test/factories'

describe(leasingAdapter.getListingsWithApplicants, () => {
  it('returns err if request fails', async () => {
    nock(config.tenantsLeasesService.url)
      .get('/listings-with-applicants')
      .reply(500)

    const result = await leasingAdapter.getListingsWithApplicants('')

    expect(result.ok).toBe(false)
  })

  it('returns listings', async () => {
    nock(config.tenantsLeasesService.url)
      .get('/listings-with-applicants')
      .query({ type: 'published' })
      .reply(200, { content: factory.listing.buildList(1) })

    const result =
      await leasingAdapter.getListingsWithApplicants('type=published')

    expect(result).toMatchObject({
      ok: true,
      data: [expect.objectContaining({ id: expect.any(Number) })],
    })
  })
})

describe(leasingAdapter.updateListingStatus, () => {
  it('returns err if leasing responds with 404', async () => {
    nock(config.tenantsLeasesService.url).put('/listings/123/status').reply(404)

    const result = await leasingAdapter.updateListingStatus(
      123,
      ListingStatus.Expired
    )

    expect(result).toEqual({ ok: false, err: 'not-found' })
  })

  it('returns err if leasing responds with 500', async () => {
    nock(config.tenantsLeasesService.url).put('/listings/123/status').reply(500)

    const result = await leasingAdapter.updateListingStatus(
      123,
      ListingStatus.Expired
    )

    expect(result).toEqual({ ok: false, err: 'unknown' })
  })

  it('returns ok if leasing responds with 200', async () => {
    nock(config.tenantsLeasesService.url).put('/listings/123/status').reply(200)

    const result = await leasingAdapter.updateListingStatus(
      123,
      ListingStatus.Expired
    )

    expect(result).toEqual({ ok: true, data: null })
  })
})