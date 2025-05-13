import { HttpStatusCode } from 'axios'
import { logger, loggedAxios as axios } from 'onecore-utilities'
import {
  Applicant,
  InternalParkingSpaceSyncSuccessResponse,
  Listing,
  ListingStatus,
  UpdateListingStatusErrorCodes,
  WaitingListType,
} from 'onecore-types'

import { AdapterResult } from '../types'
import config from '../../common/config'

const tenantsLeasesServiceUrl = config.tenantsLeasesService.url

const getActiveListingByRentalObjectCode = async (
  rentalObjectCode: string
): Promise<AdapterResult<Listing | undefined, 'not-found' | 'unknown'>> => {
  try {
    const res = await axios.get(
      `${tenantsLeasesServiceUrl}/listings/active/by-code/${rentalObjectCode}`
    )

    if (res.status == HttpStatusCode.NotFound) {
      return { ok: false, err: 'not-found' }
    }

    return { ok: true, data: res.data.content }
  } catch (error) {
    logger.error(error, 'Error fetching active listing by rental object code:')
    return { ok: false, err: 'unknown' }
  }
}

const getListingsWithApplicants = async (
  querystring: string
): Promise<AdapterResult<Listing[], 'unknown'>> => {
  try {
    const response = await axios.get(
      `${tenantsLeasesServiceUrl}/listings-with-applicants?${querystring}`
    )
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(error, 'Error fetching listings with applicants:')
    return { ok: false, err: 'unknown' }
  }
}

const createNewListing = async (
  listingData: Listing
): Promise<AdapterResult<Listing, 'conflict' | 'unknown'>> => {
  try {
    const response = await axios.post(
      `${tenantsLeasesServiceUrl}/listings`,
      listingData
    )

    if (response.status === HttpStatusCode.Conflict) {
      return { ok: false, err: 'conflict' }
    }

    if (response.status === HttpStatusCode.Created) {
      return { ok: true, data: response.data.content }
    }

    return { ok: false, err: 'unknown' }
  } catch (error) {
    logger.error(error, 'Error creating new listing:')
    return { ok: false, err: 'unknown' }
  }
}

const applyForListing = async (
  applicantData: Omit<Applicant, 'id'>
): Promise<
  AdapterResult<Applicant, 'conflict' | 'unknown' | 'bad-request'>
> => {
  try {
    const res = await axios.post(
      `${tenantsLeasesServiceUrl}/listings/apply`,
      applicantData
    )
    if (res.status === HttpStatusCode.Conflict) {
      return { ok: false, err: 'conflict' }
    }

    if (res.status === HttpStatusCode.BadRequest) {
      return { ok: false, err: 'bad-request' }
    }

    if (
      res.status != HttpStatusCode.Ok &&
      res.status != HttpStatusCode.Created
    ) {
      logger.error(
        { status: res.status, data: res.data },
        'Error applying for listing:' + applicantData.listingId
      )
      return { ok: false, err: 'unknown' }
    }

    return { ok: true, data: res.data.content }
  } catch (error) {
    logger.error(error, 'Error applying for listing:', error)
    return { ok: false, err: 'unknown' }
  }
}

const getListingByListingId = async (
  listingId: number
): Promise<Listing | undefined> => {
  try {
    const result = await axios.get(
      `${tenantsLeasesServiceUrl}/listings/by-id/${listingId}`
    )
    return result.data.content
  } catch (error) {
    logger.error(error, 'Error fetching listing by rental object code')
    return undefined
  }
}

const syncInternalParkingSpacesFromXpand = async () => {
  try {
    const res = await axios.post<{
      content: InternalParkingSpaceSyncSuccessResponse
    }>(`${tenantsLeasesServiceUrl}/listings/sync-internal-from-xpand`)

    if (res.status !== 200) {
      return { ok: false, err: 'unknown' } as const
    }

    return { ok: true, data: res.data.content } as const
  } catch (err) {
    logger.error({ err }, 'leasing-adapter.syncInternalParkingSpacesFromXpand')
    return { ok: false, err: 'unknown' } as const
  }
}

const deleteListing = async (
  listingId: number
): Promise<
  AdapterResult<
    null,
    {
      tag: 'conflict' | 'unknown'
      data: unknown
    }
  >
> => {
  const res = await axios.delete(
    `${tenantsLeasesServiceUrl}/listings/${listingId}`
  )

  if (res.status === 200) {
    return { ok: true, data: null }
  }

  if (res.status === 409) {
    return { ok: false, err: { tag: 'conflict', data: res.data } }
  }

  return { ok: false, err: { tag: 'unknown', data: res.data } }
}

async function updateListingStatus(
  listingId: number,
  status: ListingStatus
): Promise<AdapterResult<null, UpdateListingStatusErrorCodes>> {
  try {
    const res = await axios.put(
      `${tenantsLeasesServiceUrl}/listings/${listingId}/status`,
      { status }
    )

    if (res.status !== 200) {
      if (res.status === 404) {
        return {
          ok: false,
          err: UpdateListingStatusErrorCodes.NotFound,
          statusCode: 404,
        }
      }

      if (res.status === 400) {
        return {
          ok: false,
          err: UpdateListingStatusErrorCodes.BadRequest,
          statusCode: 400,
        }
      }

      return {
        ok: false,
        err: UpdateListingStatusErrorCodes.Unknown,
        statusCode: 500,
      }
    }

    return { ok: true, data: null }
  } catch (err) {
    logger.error({ err }, 'leasingAdapter.updateListingStatus')
    return {
      ok: false,
      err: UpdateListingStatusErrorCodes.Unknown,
      statusCode: 500,
    }
  }
}

const getExpiredListingsWithNoOffers = async (): Promise<
  AdapterResult<Listing[], 'unknown'>
> => {
  try {
    const response = await axios.get(
      `${tenantsLeasesServiceUrl}/listings/readyforoffers`
    )
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(error, 'Error fetching expired listings without offers:')
    return { ok: false, err: 'unknown' }
  }
}

const getListings = async (
  published?: boolean,
  rentalRule?: 'Scored' | 'NonScored'
): Promise<AdapterResult<Listing[], 'unknown'>> => {
  const queryParams = new URLSearchParams()
  if (published) queryParams.append('published', published.toString())
  if (rentalRule) queryParams.append('rentalRule', rentalRule)

  try {
    const response = await axios.get(
      `${tenantsLeasesServiceUrl}/listings?${queryParams}`
    )
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(error, 'Error fetching listings:')
    return { ok: false, err: 'unknown' }
  }
}

export {
  getActiveListingByRentalObjectCode,
  getListingsWithApplicants,
  createNewListing,
  applyForListing,
  getListingByListingId,
  syncInternalParkingSpacesFromXpand,
  deleteListing,
  updateListingStatus,
  getExpiredListingsWithNoOffers,
  getListings,
}
