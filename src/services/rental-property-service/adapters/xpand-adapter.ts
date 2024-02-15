import axios from 'axios'
import Config from '../../../common/config'
import {
  ParkingSpace,
  ParkingSpaceApplicationCategory,
  ParkingSpaceType,
  parkingSpaceApplicationCategoryTranslation,
  parkingSpaceTypeTranslation,
} from '../../../common/types'

const getParkingSpaceType = (typeCode: string) => {
  let type = parkingSpaceTypeTranslation[typeCode]

  if (!type) {
    type = ParkingSpaceType.ParkingSpaceWithoutElectricity
  }

  return type
}

const getParkingSpaceApplicationCategory = (waitingListType: string) => {
  let category = parkingSpaceApplicationCategoryTranslation[waitingListType]

  if (!category) {
    category = ParkingSpaceApplicationCategory.internal
  }

  return category
}

const getStreet = (streetAndNumber: string) => {
  const matches = streetAndNumber.split(/([^0-9]+) ([0-9].*)/)

  return matches[1]
}

const getStreetNumber = (streetAndNumber: string) => {
  const matches = streetAndNumber.split(/([^0-9]+) ([0-9].*)/)

  return matches.length > 1 ? matches[2] : ''
}

const getParkingSpace = async (parkingSpaceId: string) => {
  try {
    const url = `${Config.xpandService.url}/publishedrentalobjects/parkings/${parkingSpaceId}`

    const response = await axios({
      method: 'get',
      url: url,
    })

    const parkingSpace: ParkingSpace = {
      parkingSpaceId: response.data.rentalObjectCode,
      address: {
        street: getStreet(response.data.postalAddress),
        number: getStreetNumber(response.data.postalAddress),
        postalCode: response.data.zipCode,
        city: response.data.city,
      },
      vacantFrom: response.data.vacantFrom,
      rent: {
        currentRent: response.data.monthRent,
        futureRents: [],
      },
      type: getParkingSpaceType(response.data.objectTypeCode),
      applicationCategory: getParkingSpaceApplicationCategory(
        response.data.waitingListType
      ),
    }

    return parkingSpace
  } catch (error) {
    return null
  }
}

export { getParkingSpace }
