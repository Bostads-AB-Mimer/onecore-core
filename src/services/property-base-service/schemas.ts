import { z } from 'zod'

export const ResidenceSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  deleted: z.boolean(),
  validityPeriod: z.object({
    fromDate: z.string().datetime(),
    toDate: z.string().datetime(),
  }),
})

export const ResidenceDetailsSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  deleted: z.boolean(),
  validityPeriod: z.object({
    fromDate: z.string().datetime(),
    toDate: z.string().datetime(),
  }),
  location: z.string(),
  accessibility: z.object({
    wheelchairAccessible: z.boolean(),
    residenceAdapted: z.boolean(),
    elevator: z.boolean(),
  }),
  features: z.object({
    balcony1: z.object({
      location: z.string(),
      type: z.string(),
    }),
    balcony2: z.object({
      location: z.string(),
      type: z.string(),
    }),
    patioLocation: z.string(),
    hygieneFacility: z.string(),
    sauna: z.boolean(),
    extraToilet: z.boolean(),
    sharedKitchen: z.boolean(),
    petAllergyFree: z.boolean(),
    electricAllergyIntolerance: z.boolean(),
    smokeFree: z.boolean(),
    asbestos: z.boolean(),
  }),
  entrance: z.string(),
  partNo: z.number(),
  part: z.string(),
  residenceType: z.object({
    residenceTypeId: z.string(),
    code: z.string(),
    name: z.string(),
    roomCount: z.number(),
    kitchen: z.number(),
    systemStandard: z.number(),
    checklistId: z.string(),
    componentTypeActionId: z.string(),
    statisticsGroupSCBId: z.string(),
    statisticsGroup2Id: z.string(),
    statisticsGroup3Id: z.string(),
    statisticsGroup4Id: z.string(),
    timestamp: z.string(),
  }),
  propertyObject: z.object({
    energy: z.object({
      energyClass: z.number(),
      energyRegistered: z.string().datetime(),
      energyReceived: z.string().datetime(),
      energyIndex: z.number(),
    }),
  }),
})

export const GetResidencesQueryParamsSchema = z.object({
  buildingCode: z.string(),
  staircaseCode: z.string().optional(),
})

export type Residence = z.infer<typeof ResidenceSchema>
export type ResidenceDetails = z.infer<typeof ResidenceDetailsSchema>
