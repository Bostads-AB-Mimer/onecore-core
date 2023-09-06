import axios from 'axios'
import {
  // MaterialChoice,
  MaterialOption,
  // MaterialOptionGroup,
  RentalProperty,
  // RoomType,
} from '../../../common/types'
import config from '../../../common/config'

const propertyInfoServiceUrl = config.propertyInfoService.url

const getRentalProperty = async (
  rentalPropertyId: string
): Promise<RentalProperty> => {
  const propertyResponse = await axios(
    propertyInfoServiceUrl + '/rentalproperties/' + rentalPropertyId
  )

  return propertyResponse.data
}

// const getRoomTypes = async (apartmentId: string): Promise<Array<RoomType>> => {
//   const roomTypesResponse = await axios(
//     `${propertyInfoServiceUrl}/rentalproperties/${apartmentId}/room-types`
//   )

//   return roomTypesResponse.data
// }

// const getRoomType = async (
//   aparmentId: string,
//   roomTypeId: string
// ): Promise<RoomType | undefined> => {
//   const roomTypes = await getRoomTypes(aparmentId)

//   return roomTypes.find(
//     (roomType: RoomType) => roomType.roomTypeId == roomTypeId
//   )
// }

// const getSingleMaterialOption = async (
//   apartmentId: string,
//   materialOptionId: string
// ) => {
//   // const roomType = await getRoomType(apartmentId, roomTypeId)
//   // const group = await getMaterialOptionGroup(roomTypeId, materialOptionGroupId)
//   const option = await getMaterialOption(
//     // roomTypeId,
//     // materialOptionGroupId,
//     apartmentId,
//     materialOptionId
//   )

//   // if (option) {
//   //   option.roomTypeName = roomType && roomType.name
//   //   option.materialOptionGroupName = option && group && group.name
//   // }

//   return option
// }

// const getMaterialOptionGroupsByRoomType = async (
//   roomTypeId: string
// ): Promise<Array<MaterialOptionGroup>> => {
//   const materialOptionGroupsResponse = await axios(
//     `${propertyInfoServiceUrl}/room-types/${roomTypeId}/material-option-groups`
//   )

//   return materialOptionGroupsResponse.data
// }

const getRoomTypeWithMaterialOptions = async (apartmentId: string) => {
  const materialOptionGroupsResponse = await axios(
    `${propertyInfoServiceUrl}/rentalproperties/${apartmentId}/material-options`
  )

  return materialOptionGroupsResponse.data
}

// const getMaterialOptionGroup = async (
//   roomTypeId: string,
//   materialOptionGroupId: string
// ): Promise<MaterialOptionGroup | undefined> => {
//   let groups = await getMaterialOptionGroupsByRoomType(roomTypeId)

//   return groups.find(
//     (materialOptionGroup: MaterialOptionGroup) =>
//       materialOptionGroup.materialOptionGroupId == materialOptionGroupId
//   )
// }

const getMaterialOption = async (
  // roomTypeId: string,
  // materialOptionGroupId: string,
  apartmentId: string,
  materialOptionId: string
): Promise<MaterialOption | undefined> => {
  const materialOptionGroupsResponse = await axios(
    `${propertyInfoServiceUrl}/rentalproperties/${apartmentId}/material-options/${materialOptionId}`
  )

  return materialOptionGroupsResponse.data

  // let materialOption: MaterialOption | undefined
  // let groups = await getMaterialOptionGroupsByRoomType(roomTypeId)

  // groups
  //   .filter(
  //     (group: MaterialOptionGroup) =>
  //       group.materialOptionGroupId == materialOptionGroupId
  //   )
  //   .forEach((group: MaterialOptionGroup) => {
  //     materialOption = group.materialOptions?.find(
  //       (option: MaterialOption) => option.materialOptionId == materialOptionId
  //     )
  //   })

  // return materialOption
}

// const getMaterialOptionGroups = async (
//   roomTypeId: string
// ): Promise<Array<MaterialOptionGroup>> => {
//   const materialOptionGroupsResponse = await axios(
//     `${propertyInfoServiceUrl}/room-types/${roomTypeId}/material-option-groups`
//   )

//   return materialOptionGroupsResponse.data
// }

const getMaterialChoices = async (apartmentId: string) => {
  const materialOptionGroupsResponse = await axios(
    `${propertyInfoServiceUrl}/rentalproperties/${apartmentId}/material-choices`
  )

  return materialOptionGroupsResponse.data
}

export {
  getRentalProperty,
  getRoomTypeWithMaterialOptions,
  // getSingleMaterialOption,
  // getRoomTypes,
  // getMaterialOptionGroup,
  // getMaterialOptionGroups,
  getMaterialOption,
  getMaterialChoices,
}
