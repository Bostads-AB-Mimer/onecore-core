import { Factory } from 'fishery'
import { components } from '../../src/adapters/property-base-adapter/generated/api-types'

export const ResidenceDetailsFactory = Factory.define<
  components['schemas']['ResidenceDetails']
>(({ sequence }) => ({
  id: `_0J415BS4${sequence}`,
  code: `010${sequence}`,
  name: 'Adressgatan 123',
  deleted: false,
  validityPeriod: {
    fromDate: '2024-10-01',
    toDate: '2025-10-01',
  },
  accessibility: {
    wheelchairAccessible: false,
    residenceAdapted: false,
    elevator: false,
  },
  features: {
    balcony1: {
      location: 'S',
      type: 'V',
    },
    hygieneFacility: 'B',
    sauna: false,
    extraToilet: false,
    sharedKitchen: false,
    petAllergyFree: false,
    electricAllergyIntolerance: false,
    smokeFree: false,
    asbestos: false,
  },
  entrance: '1',
  residenceType: {
    residenceTypeId: 'string',
    code: '2RK',
    name: '2 rum och kök',
    roomCount: 2,
    kitchen: 1,
    systemStandard: 1,
    checklistId: null,
    componentTypeActionId: null,
    statisticsGroupSCBId: null,
    statisticsGroup2Id: null,
    statisticsGroup3Id: null,
    statisticsGroup4Id: null,
    timestamp: '_6QD0PIF66',
  },
  propertyObject: {
    energy: {
      energyClass: 1,
    },
  },
}))
