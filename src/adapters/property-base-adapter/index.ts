import { logger } from 'onecore-utilities'
import createClient from 'openapi-fetch'

import { AdapterResult } from '../types'
import { components, paths } from './generated/api-types'

import config from '../../common/config'

const client = () =>
  createClient<paths>({
    baseUrl: config.propertyBaseService.url,
    headers: {
      'Content-Type': 'application/json',
    },
  })

type SearchPropertiesResponse = components['schemas']['Property'][]

export async function searchProperties(
  q: string
): Promise<AdapterResult<SearchPropertiesResponse, 'unknown'>> {
  try {
    const response = await client().GET('/properties/search', {
      params: { query: { q } },
    })

    if (response.data) {
      return { ok: true, data: response.data.content ?? [] }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.searchProperties')
    return { ok: false, err: 'unknown' }
  }
}

type SearchBuildingsResponse = components['schemas']['Building'][]

export async function searchBuildings(
  q: string
): Promise<AdapterResult<SearchBuildingsResponse, 'unknown'>> {
  try {
    const response = await client().GET('/buildings/search', {
      params: { query: { q } },
    })

    if (response.data) {
      return { ok: true, data: response.data.content ?? [] }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.searchBuildings')
    return { ok: false, err: 'unknown' }
  }
}

type SearchResidencesResponse = components['schemas']['ResidenceSearchResult'][]

export async function searchResidences(
  q: string
): Promise<AdapterResult<SearchResidencesResponse, 'unknown'>> {
  try {
    const response = await client().GET('/residences/search', {
      params: { query: { q } },
    })

    if (response.data) {
      return { ok: true, data: response.data.content ?? [] }
    }

    throw { ok: false, err: 'missing response data invariant' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.searchResidences')
    return { ok: false, err: 'unknown' }
  }
}

type GetBuildingResponse = components['schemas']['Building']

export async function getBuildingByCode(
  buildingCode: string
): Promise<AdapterResult<GetBuildingResponse, 'not-found' | 'unknown'>> {
  try {
    const fetchResponse = await client().GET(
      '/buildings/by-building-code/{buildingCode}',
      {
        params: { path: { buildingCode } },
      }
    )

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    if (fetchResponse.response.status === 404) {
      return { ok: false, err: 'not-found' }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getBuilding')
    return { ok: false, err: 'unknown' }
  }
}

type GetCompaniesResponse = components['schemas']['Company'][]

export async function getCompanies(): Promise<
  AdapterResult<GetCompaniesResponse, 'unknown'>
> {
  try {
    const fetchResponse = await client().GET('/companies')

    if (fetchResponse.data?.content) {
      return {
        ok: true,
        data: fetchResponse.data.content,
      }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error(err, 'property-base-adapter.getCompanies')
    return { ok: false, err: 'unknown' }
  }
}

type GetPropertiesResponse = components['schemas']['Property'][]

export async function getProperties(
  companyCode: string,
  tract?: string
): Promise<AdapterResult<GetPropertiesResponse, 'unknown'>> {
  try {
    const fetchResponse = await client().GET('/properties', {
      params: { query: { companyCode, tract } },
    })

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getProperties')
    return { ok: false, err: 'unknown' }
  }
}

type GetPropertyDetailsResponse = components['schemas']['PropertyDetails']

export async function getPropertyDetails(
  propertyId: string
): Promise<AdapterResult<GetPropertyDetailsResponse, 'not-found' | 'unknown'>> {
  try {
    const fetchResponse = await client().GET('/properties/{id}', {
      params: { path: { id: propertyId } },
    })

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    if (fetchResponse.response.status === 404) {
      return { ok: false, err: 'not-found' }
    }

    throw new Error(
      `Unexpected response status: ${fetchResponse.response.status}`
    )
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getPropertyDetails')
    return { ok: false, err: 'unknown' }
  }
}

type GetResidencesResponse = components['schemas']['Residence'][]

export async function getResidences(
  buildingCode: string,
  staircaseCode?: string
): Promise<AdapterResult<GetResidencesResponse, 'unknown'>> {
  try {
    const fetchResponse = await client().GET('/residences', {
      params: { query: { buildingCode, floorCode: staircaseCode } },
    })

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getResidences')
    return { ok: false, err: 'unknown' }
  }
}

type GetResidenceDetailsResponse = components['schemas']['ResidenceDetails']

export async function getResidenceDetails(
  residenceId: string
): Promise<
  AdapterResult<GetResidenceDetailsResponse, 'not-found' | 'unknown'>
> {
  try {
    const fetchResponse = await client().GET('/residences/{id}', {
      params: { path: { id: residenceId } },
    })

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    if (fetchResponse.response.status === 404) {
      return { ok: false, err: 'not-found' }
    }

    throw new Error(
      `Unexpected response status: ${fetchResponse.response.status}`
    )
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getResidenceDetails')
    return { ok: false, err: 'unknown' }
  }
}

type GetResidenceByRentalIdResponse =
  components['schemas']['GetResidenceByRentalIdResponse']['content']

export async function getResidenceByRentalId(
  rentalId: string
): Promise<
  AdapterResult<GetResidenceByRentalIdResponse, 'not-found' | 'unknown'>
> {
  try {
    const fetchResponse = await client().GET(
      '/residences/rental-id/{rentalId}',
      {
        params: { path: { rentalId: rentalId } },
      }
    )

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    if (fetchResponse.response.status === 404) {
      return { ok: false, err: 'not-found' }
    }

    throw new Error(
      `Unexpected response status: ${fetchResponse.response.status}`
    )
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getResidenceByRentalId')
    return { ok: false, err: 'unknown' }
  }
}

type GetStaircasesResponse = components['schemas']['Staircase'][]

export async function getStaircases(
  buildingCode: string
): Promise<AdapterResult<GetStaircasesResponse, 'not-found' | 'unknown'>> {
  try {
    const fetchResponse = await client().GET('/staircases', {
      params: { query: { buildingCode } },
    })

    if (fetchResponse.data?.content) {
      return { ok: true, data: fetchResponse.data.content }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getStaircases')
    return { ok: false, err: 'unknown' }
  }
}

type GetRoomsResponse = components['schemas']['Room'][]

export async function getRooms(
  residenceId: string
): Promise<AdapterResult<GetRoomsResponse, 'unknown'>> {
  try {
    const fetchResponse = await client().GET('/rooms', {
      params: { query: { residenceId } },
    })

    if (!fetchResponse.data?.content) {
      throw { ok: false, err: 'unknown' }
    }

    return { ok: true, data: fetchResponse.data.content }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getRooms')
    return { ok: false, err: 'unknown' }
  }
}

type GetParkingSpaceResponse = components['schemas']['ParkingSpace']

export async function getParkingSpaceByRentalId(
  rentalId: string
): Promise<AdapterResult<GetParkingSpaceResponse, 'not-found' | 'unknown'>> {
  try {
    const response = await client().GET('/parking-spaces/by-rental-id/{id}', {
      params: { path: { id: rentalId } },
    })

    if (response.data?.content) {
      return { ok: true, data: response.data.content }
    }
    if (response.response.status === 404) {
      return { ok: false, err: 'not-found' }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getParkingSpaceByRentalId')
    return { ok: false, err: 'unknown' }
  }
}

type GetMaintenanceUnitsByRentalPropertyIdResponse =
  components['schemas']['MaintenanceUnit'][]

export async function getMaintenanceUnitsForRentalProperty(
  rentalPropertyId: string
): Promise<
  AdapterResult<GetMaintenanceUnitsByRentalPropertyIdResponse, 'unknown'>
> {
  try {
    const fetchResponse = await client().GET(
      '/maintenance-units/by-rental-id/{id}',
      {
        params: { path: { id: rentalPropertyId } },
      }
    )
    if (!fetchResponse.data?.content) {
      throw { ok: false, err: 'unknown' }
    }

    return { ok: true, data: fetchResponse.data.content }
  } catch (err) {
    logger.error(
      { err },
      'property-base-adapter.getMaintenanceUnitsForRentalProperty'
    )
    return { ok: false, err: 'unknown' }
  }
}

type GetFacilityByRentalIdResponse =
  components['schemas']['GetFacilityByRentalIdResponse']['content']

export async function getFacilityByRentalId(
  rentalId: string
): Promise<
  AdapterResult<GetFacilityByRentalIdResponse, 'not-found' | 'unknown'>
> {
  try {
    const fetchResponse = await client().GET(
      '/facilities/rental-id/{rentalId}',
      {
        params: { path: { rentalId } },
      }
    )

    if (fetchResponse.error) {
      throw fetchResponse.error
    }

    if (fetchResponse.response.status === 404) {
      logger.info(
        { err: `Facility not found for rental id: ${rentalId}` },
        'property-base-adapter.getFacilityByRentalId'
      )

      return { ok: false, err: 'not-found' }
    }

    if (!fetchResponse.data?.content) {
      throw 'Invariant: response data missing'
    }

    return { ok: true, data: fetchResponse.data.content }
  } catch (err) {
    logger.error({ err }, 'property-base-adapter.getFacilityByRentalId')
    return { ok: false, err: 'unknown' }
  }
}
