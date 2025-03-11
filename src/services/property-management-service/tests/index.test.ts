import axios from 'axios'
jest.mock('onecore-utilities', () => {
  return {
    logger: {
      info: () => {
        return
      },
      error: () => {
        return
      },
    },
    loggedAxios: axios,
    axiosTypes: axios,
    generateRouteMetadata: jest.fn(() => ({})),
  }
})

import request from 'supertest'
import Koa from 'koa'
import KoaRouter from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { routes } from '../index'
import * as propertyManagementAdapter from '../../../adapters/property-management-adapter'
import * as leasingAdapter from '../../../adapters/leasing-adapter'
import * as factory from '../../../../test/factories'
import { MaintenanceUnitInfo } from 'onecore-types'

const app = new Koa()
const router = new KoaRouter()
routes(router)
app.use(bodyParser())
app.use(router.routes())

describe('rental-property-service index', () => {
  describe('GET /rentalproperties/:id/rooms-with-material-choices', () => {
    it('responds', async () => {
      const materialChoicesSpy = jest
        .spyOn(propertyManagementAdapter, 'getRoomsWithMaterialChoices')
        .mockResolvedValue({
          roomTypes: [
            {
              roomTypeId: 'BADRUM',
              name: 'BADRUM',
              materialOptionGroups: [Array],
            },
            { roomTypeId: 'KÖK', name: 'KÖK', materialOptionGroups: [Array] },
            {
              roomTypeId: 'RUM 1',
              name: 'RUM 1',
              materialOptionGroups: [Array],
            },
            {
              roomTypeId: 'VARDAGSRUM',
              name: 'VARDAGSRUM',
              materialOptionGroups: [Array],
            },
          ],
        })

      const res = await request(app.callback()).get(
        '/rentalproperties/406-097-11-0201/rooms-with-material-choices'
      )

      expect(res.status).toBe(200)
      expect(materialChoicesSpy).toHaveBeenCalled()
      expect(res.body.content.roomTypes).toBeDefined()
    })
  })
  describe('GET /maintenanceUnits/rentalPropertyId/:rentalPropertyId/:type?', () => {
    const maintenanceUnitInfoMock: MaintenanceUnitInfo[] =
      factory.maintenanceUnitInfo
        .buildList(4)
        .map((maintenanceUnitInfo, index) => ({
          ...maintenanceUnitInfo,
          type: index % 2 === 0 ? 'Tvättstuga' : 'Miljöbod',
        }))

    it('should return all maintenance units', async () => {
      const getMaintenanceUnitsForRentalPropertySpy = jest
        .spyOn(
          propertyManagementAdapter,
          'getMaintenanceUnitsForRentalProperty'
        )
        .mockResolvedValue(maintenanceUnitInfoMock)

      const res = await request(app.callback()).get(
        '/api/maintenanceUnits/rentalPropertyId/705-022-04-0201'
      )
      expect(res.status).toBe(200)
      expect(res.body.content).toEqual(maintenanceUnitInfoMock)
      expect(getMaintenanceUnitsForRentalPropertySpy).toHaveBeenCalledWith(
        '705-022-04-0201'
      )
    })

    it('should return maintenance units by type', async () => {
      const getMaintenanceUnitsForRentalPropertySpy = jest
        .spyOn(
          propertyManagementAdapter,
          'getMaintenanceUnitsForRentalProperty'
        )
        .mockResolvedValue(maintenanceUnitInfoMock)

      const res = await request(app.callback()).get(
        '/api/maintenanceUnits/rentalPropertyId/705-022-04-0201/Miljöbod'
      )

      expect(res.status).toBe(200)
      expect(res.body.content).toEqual([
        maintenanceUnitInfoMock[1],
        maintenanceUnitInfoMock[3],
      ])
      expect(getMaintenanceUnitsForRentalPropertySpy).toHaveBeenCalledWith(
        '705-022-04-0201'
      )
    })
  })

  describe('GET /maintenanceUnits/contactCode/:contactCode', () => {
    const maintenanceUnitInfoMock: MaintenanceUnitInfo[] =
      factory.maintenanceUnitInfo
        .buildList(4)
        .map((maintenanceUnitInfo, index) => ({
          ...maintenanceUnitInfo,
          type: index % 2 === 0 ? 'Tvättstuga' : 'Miljöbod',
        }))
    const contactMock = factory.contact.build()
    const leaseMock = factory.lease.build()

    it('should return all maintenance units', async () => {
      const getContactSpy = jest
        .spyOn(leasingAdapter, 'getContactByContactCode')
        .mockResolvedValue({ ok: true, data: contactMock })
      const getLeasesForContactCodeSpy = jest
        .spyOn(leasingAdapter, 'getLeasesForContactCode')
        .mockResolvedValue([leaseMock])
      const getMaintenanceUnitsForRentalPropertySpy = jest
        .spyOn(
          propertyManagementAdapter,
          'getMaintenanceUnitsForRentalProperty'
        )
        .mockResolvedValue(maintenanceUnitInfoMock)

      const res = await request(app.callback()).get(
        '/api/maintenanceUnits/contactCode/P965339'
      )

      expect(res.status).toBe(200)
      expect(res.body.content).toEqual(maintenanceUnitInfoMock)
      expect(getContactSpy).toHaveBeenCalledWith('P965339')
      expect(getLeasesForContactCodeSpy).toHaveBeenCalledWith(
        contactMock.contactCode,
        false,
        false
      )
      expect(getMaintenanceUnitsForRentalPropertySpy).toHaveBeenCalledWith(
        leaseMock.rentalPropertyId
      )
    })
  })
})
