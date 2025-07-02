import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import config from '../../common/config'
import * as propertyBaseAdapter from '../property-base-adapter'
import * as factory from '../../../test/factories'

const mockServer = setupServer()

describe('property-base-adapter', () => {
  beforeAll(() => {
    mockServer.listen()
  })

  afterEach(() => {
    mockServer.resetHandlers()
  })

  afterAll(() => {
    mockServer.close()
  })

  describe('getBuildingByCode', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/buildings/by-building-code/123-123`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getBuildingByCode('123-123')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns not-found if building is not found', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/buildings/by-building-code/123-123`,
          () => new HttpResponse(null, { status: 404 })
        )
      )

      const result = await propertyBaseAdapter.getBuildingByCode('123-123')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('not-found')
    })

    it('returns building', async () => {
      const buildingMock = factory.building.build()
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/buildings/by-building-code/123-123`,
          () =>
            HttpResponse.json(
              {
                content: buildingMock,
              },
              { status: 200 }
            )
        )
      )

      const result = await propertyBaseAdapter.getBuildingByCode('123-123')
      expect(result).toMatchObject({
        ok: true,
        data: buildingMock,
      })
    })
  })

  describe('getCompanies', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/companies`,
          () => new HttpResponse(null, { status: 500 })
        )
      )
      const result = await propertyBaseAdapter.getCompanies()
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns companies', async () => {
      const companiesMock = factory.company.buildList(3)
      mockServer.use(
        http.get(`${config.propertyBaseService.url}/companies`, () =>
          HttpResponse.json(
            {
              content: companiesMock,
            },
            { status: 200 }
          )
        )
      )
      const result = await propertyBaseAdapter.getCompanies()
      expect(result).toMatchObject({
        ok: true,
        data: companiesMock,
      })
    })
  })

  describe('getResidences', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getResidences('202-002')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns residences', async () => {
      const residencesMock = factory.residence.buildList(3)
      mockServer.use(
        http.get(`${config.propertyBaseService.url}/residences`, () =>
          HttpResponse.json(
            {
              content: residencesMock,
            },
            { status: 200 }
          )
        )
      )

      const result = await propertyBaseAdapter.getResidences('202-002')

      expect(result).toMatchObject({
        ok: true,
        data: residencesMock,
      })
    })
  })

  describe('getProperties', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/properties`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getProperties('001')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns properties', async () => {
      const propertiesMock = factory.property.buildList(3)
      mockServer.use(
        http.get(`${config.propertyBaseService.url}/properties`, () =>
          HttpResponse.json(
            {
              content: propertiesMock,
            },
            { status: 200 }
          )
        )
      )

      const result = await propertyBaseAdapter.getProperties('001')

      expect(result).toMatchObject({
        ok: true,
        data: propertiesMock,
      })
    })
  })

  describe('getPropertyDetails', () => {
    it('returns err if request fails', async () => {
      const propertyDetailsMock = factory.propertyDetails.build()

      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/properties/${propertyDetailsMock.id}`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getPropertyDetails(
        propertyDetailsMock.id
      )

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns not-found if property is not found', async () => {
      const propertyDetailsMock = factory.propertyDetails.build()

      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/properties/${propertyDetailsMock.id}`,
          () => new HttpResponse(null, { status: 404 })
        )
      )

      const result = await propertyBaseAdapter.getPropertyDetails(
        propertyDetailsMock.id
      )

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('not-found')
    })

    it('returns property', async () => {
      const propertyDetailsMock = factory.property.build()
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/properties/${propertyDetailsMock.id}`,
          () =>
            HttpResponse.json(
              {
                content: propertyDetailsMock,
              },
              { status: 200 }
            )
        )
      )

      const result = await propertyBaseAdapter.getPropertyDetails(
        propertyDetailsMock.id
      )

      expect(result).toMatchObject({
        ok: true,
        data: propertyDetailsMock,
      })
    })
  })

  describe('searchProperties', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/properties/search`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.searchProperties('001')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns properties', async () => {
      const propertiesMock = factory.property.buildList(2)
      mockServer.use(
        http.get(`${config.propertyBaseService.url}/properties/search`, () =>
          HttpResponse.json(
            {
              content: propertiesMock,
            },
            { status: 200 }
          )
        )
      )

      const result = await propertyBaseAdapter.searchProperties('KVARTER 1')

      expect(result.ok).toBe(true)
      expect(result).toMatchObject({
        ok: true,
        data: propertiesMock,
      })
    })
  })

  describe('getResidenceByRentalId', () => {
    it('returns err if request fails', async () => {
      const residenceDetailsMock = factory.residenceByRentalIdDetails.build()

      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences/rental-id/1234`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getResidenceByRentalId('1234')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns not-found if residence is not found', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences/rental-id/1234`,
          () => new HttpResponse(null, { status: 404 })
        )
      )

      const result = await propertyBaseAdapter.getResidenceByRentalId('1234')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('not-found')
    })

    it('returns residence', async () => {
      const residenceDetailsMock = factory.residenceByRentalIdDetails.build()
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences/rental-id/1234`,
          () =>
            HttpResponse.json(
              {
                content: residenceDetailsMock,
              },
              { status: 200 }
            )
        )
      )

      const result = await propertyBaseAdapter.getResidenceByRentalId('1234')

      expect(result).toMatchObject({
        ok: true,
        data: residenceDetailsMock,
      })
    })
  })
  describe('getResidenceDetails', () => {
    it('returns err if request fails', async () => {
      const residenceDetailsMock = factory.residenceDetails.build()

      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences/${residenceDetailsMock.id}`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getResidenceDetails(
        residenceDetailsMock.id
      )

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns not-found if residence is not found', async () => {
      const residenceDetailsMock = factory.residenceDetails.build()

      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences/${residenceDetailsMock.id}`,
          () => new HttpResponse(null, { status: 404 })
        )
      )

      const result = await propertyBaseAdapter.getResidenceDetails(
        residenceDetailsMock.id
      )

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('not-found')
    })

    it('returns residence', async () => {
      const residenceDetailsMock = factory.residenceDetails.build()
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/residences/${residenceDetailsMock.id}`,
          () =>
            HttpResponse.json(
              {
                content: residenceDetailsMock,
              },
              { status: 200 }
            )
        )
      )

      const result = await propertyBaseAdapter.getResidenceDetails(
        residenceDetailsMock.id
      )

      expect(result).toMatchObject({
        ok: true,
        data: residenceDetailsMock,
      })
    })
  })

  describe('getStaircases', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/staircases`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getStaircases('002-002')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns staircases', async () => {
      const staircasesMock = factory.staircase.buildList(3)
      mockServer.use(
        http.get(`${config.propertyBaseService.url}/staircases`, () =>
          HttpResponse.json(
            {
              content: staircasesMock,
            },
            { status: 200 }
          )
        )
      )

      const result = await propertyBaseAdapter.getStaircases('002-002')

      expect(result).toMatchObject({
        ok: true,
        data: staircasesMock,
      })
    })
  })

  describe('getRooms', () => {
    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/rooms`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getRooms('residence-123')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns rooms', async () => {
      const roomsMock = factory.room.buildList(3)
      mockServer.use(
        http.get(`${config.propertyBaseService.url}/rooms`, () =>
          HttpResponse.json(
            {
              content: roomsMock,
            },
            { status: 200 }
          )
        )
      )

      const result = await propertyBaseAdapter.getRooms('residence-123')

      expect(result).toMatchObject({
        ok: true,
        data: roomsMock,
      })
    })
  })

  describe('getMaintenanceUnitsByRentalId', () => {
    it('returns maintenance units for a rental property', async () => {
      const maintenanceUnitsMock = factory.maintenanceUnitInfo.buildList(3)

      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/maintenance-units/by-rental-id/1234`,
          () =>
            HttpResponse.json(
              {
                content: maintenanceUnitsMock,
              },
              { status: 200 }
            )
        )
      )

      const result =
        await propertyBaseAdapter.getMaintenanceUnitsForRentalProperty('1234')

      expect(result).toMatchObject({
        ok: true,
        data: maintenanceUnitsMock,
      })
    })

    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/maintenance-units/by-rental-id/1234`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result =
        await propertyBaseAdapter.getMaintenanceUnitsForRentalProperty('1234')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })
  })

  describe('getFacilityByRentalId', () => {
    it('returns not-found if facility is not found', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/facilities/rental-id/1234`,
          () => HttpResponse.json(null, { status: 404 })
        )
      )

      const result = await propertyBaseAdapter.getFacilityByRentalId('1234')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('not-found')
    })

    it('returns err if request fails', async () => {
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/facilities/rental-id/1234`,
          () => new HttpResponse(null, { status: 500 })
        )
      )

      const result = await propertyBaseAdapter.getFacilityByRentalId('1234')

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.err).toBe('unknown')
    })

    it('returns facility', async () => {
      const facilityMock = factory.facilityDetails.build()
      mockServer.use(
        http.get(
          `${config.propertyBaseService.url}/facilities/rental-id/1234`,
          () => HttpResponse.json({ content: facilityMock }, { status: 200 })
        )
      )

      const result = await propertyBaseAdapter.getFacilityByRentalId('1234')

      expect(result).toMatchObject({
        ok: true,
        data: facilityMock,
      })
    })
  })
})
