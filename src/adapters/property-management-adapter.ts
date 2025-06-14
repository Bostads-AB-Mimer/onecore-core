import { loggedAxios as axios, logger } from 'onecore-utilities'
import {
  ApartmentInfo,
  Listing,
  MaintenanceUnitInfo,
  MaterialChoice,
  MaterialOption,
  ParkingSpace,
  RentalObject,
  RentalProperty,
  RentalPropertyInfo,
  VacantParkingSpace,
} from 'onecore-types'
import { AxiosError, HttpStatusCode } from 'axios'

import config from '../common/config'
import { AdapterResult } from './types'

const propertyManagementServiceUrl = config.propertyInfoService.url

const getRentalProperty = async (
  rentalPropertyId: string
): Promise<RentalProperty> => {
  const propertyResponse = await axios(
    propertyManagementServiceUrl + '/rentalproperties/' + rentalPropertyId
  )

  return propertyResponse.data.content
}

//todo: this function needs to be refactored to use a pattern like "getRentalPropertyInfoFromXpand".
//todo: body is possible null from propertyManagementServiceUrl and without a status returned
//todo: its not possible for a caller to know what has gone wrong (or ok)
//todo: modify calling code to use a pattern like in "getRentalPropertyInfoFromXpand"
const getRentalPropertyInfo = async (
  rentalPropertyId: string
): Promise<RentalPropertyInfo | null> => {
  const propertyResponse = await axios(
    propertyManagementServiceUrl + '/rentalPropertyInfo/' + rentalPropertyId
  )
  if (propertyResponse.status === 404) {
    return null
  }

  return propertyResponse.data.content
}

const getApartmentRentalPropertyInfo = async (
  rentalObjectCode: string
): Promise<AdapterResult<ApartmentInfo, 'not-found' | 'unknown'>> => {
  try {
    const result = await axios.get(
      `${propertyManagementServiceUrl}/rentalPropertyInfo/apartment/${rentalObjectCode}`
    )
    if (result.status === 200) {
      return {
        ok: true,
        data: result.data.content,
      }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error(err, 'Error getting apartment rental property info')
    if (err instanceof AxiosError && err.status === 404) {
      return {
        ok: false,
        err: 'not-found',
      }
    }

    return { ok: false, err: 'unknown' }
  }
}

//todo: copy of getRentalPropertyInfo above
//todo: added because callers needs to know more about the response than just the body
const getRentalPropertyInfoFromXpand = async (rentalPropertyId: string) => {
  const propertyResponse = await axios(
    propertyManagementServiceUrl + '/rentalPropertyInfo/' + rentalPropertyId
  )

  return {
    status: propertyResponse.status,
    data: propertyResponse.data.content,
  }
}

const getMaintenanceUnitsForRentalProperty = async (
  rentalPropertyId: string
): Promise<MaintenanceUnitInfo[]> => {
  const propertyResponse = await axios(
    propertyManagementServiceUrl + '/maintenanceUnits/' + rentalPropertyId
  )
  return propertyResponse.data.content
}

const getRoomTypeWithMaterialOptions = async (apartmentId: string) => {
  const materialOptionGroupsResponse = await axios(
    `${propertyManagementServiceUrl}/rentalproperties/${apartmentId}/material-options`
  )

  return materialOptionGroupsResponse.data.content
}
const getMaterialOption = async (
  apartmentId: string,
  materialOptionId: string
): Promise<MaterialOption | undefined> => {
  const materialOptionGroupsResponse = await axios(
    `${propertyManagementServiceUrl}/rentalproperties/${apartmentId}/material-options/${materialOptionId}`
  )

  return materialOptionGroupsResponse.data.content
}

const getRoomsWithMaterialChoices = async (apartmentId: string) => {
  const materialOptionGroupsResponse = await axios(
    `${propertyManagementServiceUrl}/rentalproperties/${apartmentId}/rooms-with-material-choices`
  )

  return materialOptionGroupsResponse.data.content
}

const getMaterialChoices = async (apartmentId: string, contractId?: string) => {
  let url

  if (contractId) {
    url = `${propertyManagementServiceUrl}/rentalproperties/${apartmentId}/${contractId}/material-choices`
  } else {
    url = `${propertyManagementServiceUrl}/rentalproperties/${apartmentId}/material-choices`
  }

  const materialOptionGroupsResponse = await axios(url)

  return materialOptionGroupsResponse.data.content
}

const getMaterialChoiceStatuses = async (projectCode: string) => {
  const materialOptionGroupsResponse = await axios(
    `${propertyManagementServiceUrl}/rentalproperties/material-choice-statuses?projectCode=${projectCode}`
  )

  return materialOptionGroupsResponse.data.content
}

const saveMaterialChoice = async (
  rentalPropertyId: string,
  materialChoices: Array<MaterialChoice>
) => {
  const response = await axios(
    `${propertyManagementServiceUrl}/rentalproperties/${rentalPropertyId}/material-choices`,
    {
      method: 'post',
      data: materialChoices,
    }
  )
  return response.data.content
}

const getParkingSpaceByCode = async (
  rentalObjectCode: string
): Promise<AdapterResult<VacantParkingSpace, 'not-found' | 'unknown'>> => {
  try {
    const response = await axios.get(
      `${propertyManagementServiceUrl}/parking-spaces/by-code/${rentalObjectCode}`
    )
    if (response.status === 404) {
      logger.error('Parking space not found for code:', rentalObjectCode)
      return { ok: false, err: 'not-found' }
    }
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(
      error,
      `Error retrieving rental object by code: ${rentalObjectCode}`
    )
    return { ok: false, err: 'unknown' }
  }
}

const getParkingSpaces = async (
  includeRentalObjectCodes?: string[]
): Promise<AdapterResult<VacantParkingSpace[], 'not-found' | 'unknown'>> => {
  try {
    let url = `${propertyManagementServiceUrl}/parking-spaces`

    if (includeRentalObjectCodes && includeRentalObjectCodes.length) {
      const codesParam = includeRentalObjectCodes.join(',')
      url += `?includeRentalObjectCodes=${encodeURIComponent(codesParam)}`
    }

    const response = await axios.get(url)

    if (response.status === 404) {
      logger.error(
        `Parking space not found for codes: ${includeRentalObjectCodes?.join(', ')}`
      )
      return { ok: false, err: 'not-found' }
    }
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(
      error,
      `Error retrieving rental objects by codes ${includeRentalObjectCodes?.join(', ')}`
    )
    return { ok: false, err: 'unknown' }
  }
}

//todo: refactor the subsequent requests to use same data source (soap api)
//todo: getParkingSpace uses the mimer.nu api
//todo: getPublishedParkingSpace uses the soap service
const getParkingSpace = async (
  parkingSpaceId: string
): Promise<ParkingSpace | undefined> => {
  try {
    const parkingSpaceResponse = await axios(
      `${propertyManagementServiceUrl}/parkingspaces/${parkingSpaceId}`
    )

    return parkingSpaceResponse.data.content
  } catch (error) {
    logger.error(error, 'Error retrieving parking space')
    return undefined
  }
}

const getPublishedParkingSpace = async (
  parkingSpaceId: string
): Promise<Listing | undefined> => {
  try {
    const parkingSpaceResponse = await axios(
      `${propertyManagementServiceUrl}/publishedParkingSpaces/${parkingSpaceId}`
    )

    return parkingSpaceResponse.data.content
  } catch (error) {
    logger.error(error, 'Error retrieving parking space')
    return undefined
  }
}

const getAllVacantParkingSpaces = async (): Promise<
  AdapterResult<VacantParkingSpace[], 'get-all-vacant-parking-spaces-failed'>
> => {
  try {
    const response = await axios.get(
      `${propertyManagementServiceUrl}/vacant-parkingspaces`
    )
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(error, 'Error fetching vacant-parkingspaces:')
    return { ok: false, err: 'get-all-vacant-parking-spaces-failed' }
  }
}

//todo: returnera parking space istället för rental object och flytta till onecore-property-management
const getParkingSpaceByRentalObjectCode = async (
  rentalObjectCode: string
): Promise<
  AdapterResult<
    RentalObject,
    'get-rental-object-failed' | 'rental-object-not-found'
  >
> => {
  try {
    const response = await axios.get(
      `${propertyManagementServiceUrl}/rental-object/by-code/${rentalObjectCode}`
    )
    if (response.status == HttpStatusCode.NotFound) {
      return { ok: false, err: 'rental-object-not-found' }
    }
    return { ok: true, data: response.data.content }
  } catch (error) {
    logger.error(
      error,
      'getParkingSpaceByRentalObjectCode. Error fetching rentalobject:'
    )
    return { ok: false, err: 'get-rental-object-failed' }
  }
}

export {
  getRentalProperty,
  getRentalPropertyInfo,
  getMaintenanceUnitsForRentalProperty,
  getRoomTypeWithMaterialOptions,
  getMaterialOption,
  getMaterialChoices,
  getMaterialChoiceStatuses,
  saveMaterialChoice,
  getRoomsWithMaterialChoices,
  getParkingSpace,
  getPublishedParkingSpace,
  getRentalPropertyInfoFromXpand,
  getApartmentRentalPropertyInfo,
  getAllVacantParkingSpaces,
  getParkingSpaceByRentalObjectCode,
  getParkingSpaceByCode,
  getParkingSpaces,
}
