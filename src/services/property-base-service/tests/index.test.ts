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

import * as propertyBaseAdapter from '../../../adapters/property-base-adapter'

const app = new Koa()
const router = new KoaRouter()
routes(router)
app.use(bodyParser())
app.use(router.routes())

describe('property-base-service index', () => {
  describe('GET /companies', () => {
    it('responds', async () => {
      const companiesSpy = jest
        .spyOn(propertyBaseAdapter, 'getCompanies')
        .mockResolvedValue({
          ok: true,
          data: [
            {
              id: '_0HP0ZF3I6',
              propertyObjectId: '_0HP0ZF3I6',
              code: '001',
              name: '** TEST ** BOSTADS AB MIMER',
              organizationNumber: 5560193384,
            },
          ],
        })
      const res = await request(app.callback()).get('/companies')
      expect(companiesSpy).toHaveBeenCalled()

      // Response should countain one company
      expect(res.status).toBe(200)
      expect(res.body.content).toBeDefined()
      expect(res.body.content.length).toBe(1)

      // Check if the response contains the expected properties
      expect(res.body.content[0].id).toBe('_0HP0ZF3I6')
      expect(res.body.content[0].propertyObjectId).toBe('_0HP0ZF3I6')
      expect(res.body.content[0].code).toBe('001')
      expect(res.body.content[0].name).toBe('** TEST ** BOSTADS AB MIMER')
      expect(res.body.content[0].organizationNumber).toBe(5560193384)
    })
  })
})
