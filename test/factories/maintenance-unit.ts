import { Factory } from 'fishery'
import { components } from '../../src/adapters/property-base-adapter/generated/api-types'

export const MaintenanceUnitFactory = Factory.define<
  components['schemas']['MaintenanceUnit']
>(({ sequence }) => ({
  id: `ABC${sequence}`,
  rentalPropertyId: '123-456-789',
  code: '111111',
  caption: 'TVÄTTSTUGA Testgatan 1',
  type: 'Tvättstuga',
  propertyCode: '01234',
  propertyName: 'TESTET 1',
}))
