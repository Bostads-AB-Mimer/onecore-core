import { leasing } from 'onecore-types'

export const UpdateApplicationProfileRequestParams =
  leasing.v1.CreateOrUpdateApplicationProfileRequestParamsSchema.pick({
    housingType: true,
    landlord: true,
    numAdults: true,
    numChildren: true,
    housingTypeDescription: true,
  }).extend({
    housingReference:
      leasing.v1.CreateOrUpdateApplicationProfileRequestParamsSchema.shape.housingReference.pick(
        { email: true, phone: true, comment: true }
      ),
  })

// TODO: we dont need all fields here
export const UpdateApplicationProfileResponseData =
  leasing.v1.CreateOrUpdateApplicationProfileResponseDataSchema.pick({
    contactCode: true,
    expiresAt: true,
    housingType: true,
    housingTypeDescription: true,
    id: true,
    landlord: true,
    lastUpdatedAt: true,
    numAdults: true,
    numChildren: true,
    createdAt: true,
  }).extend({
    housingReference:
      leasing.v1.CreateOrUpdateApplicationProfileResponseDataSchema.shape.housingReference.pick(
        {
          comment: true,
          createdAt: true,
          email: true,
          phone: true,
          reviewStatus: true,
          expiresAt: true,
        }
      ),
  })

// TODO: we dont need all fields here
export const GetApplicationProfileResponseData =
  leasing.v1.CreateOrUpdateApplicationProfileResponseDataSchema.pick({
    contactCode: true,
    expiresAt: true,
    housingType: true,
    housingTypeDescription: true,
    id: true,
    landlord: true,
    lastUpdatedAt: true,
    numAdults: true,
    numChildren: true,
    createdAt: true,
  }).extend({
    housingReference:
      leasing.v1.CreateOrUpdateApplicationProfileResponseDataSchema.shape.housingReference.pick(
        {
          comment: true,
          createdAt: true,
          email: true,
          phone: true,
          reviewStatus: true,
          expiresAt: true,
        }
      ),
  })
