/**
 * Self-contained service, ready to be extracted into a microservice if appropriate.
 *
 * All adapters such as database clients etc. should go into subfolders of the service,
 * not in a general top-level adapter folder to avoid service interdependencies (but of
 * course, there are always exceptions).
 */
import KoaRouter from '@koa/router'
import * as propertyBaseAdapter from '../../adapters/property-base-adapter'
import { generateRouteMetadata } from 'onecore-utilities'

/**
 * @swagger
 * openapi: 3.0.0
 * tags:
 *   - name: Property base service
 *     description: Operations related to property base service
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CompanyResponse:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Company'
 *         _links:
 *           $ref: '#/components/schemas/Links'
 *
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "_0HP0ZF3I6     "
 *         propertyObjectId:
 *           type: string
 *           example: "_0HP0ZF3I6     "
 *         code:
 *           type: string
 *           example: "001"
 *         name:
 *           type: string
 *           example: "** TEST ** BOSTADS AB MIMER"
 *         organizationNumber:
 *           type: string
 *           nullable: true
 *           example: "5560193384"
 *
 *     Links:
 *       type: object
 *       properties:
 *         self:
 *           $ref: '#/components/schemas/Link'
 *         link:
 *           $ref: '#/components/schemas/Link'
 *
 *     Link:
 *       type: object
 *       properties:
 *         href:
 *           type: string
 *           example: "http://localhost:5010/companies"
 *         templated:
 *           type: boolean
 *           example: false
 * security:
 *   - bearerAuth: []
 */
export const routes = (router: KoaRouter) => {
  /**
   * @swagger
   * /companies:
   *   get:
   *     summary: Get companies
   *     description: Returns a list of companies.
   *     tags:
   *       - Property base service
   *     responses:
   *       200:
   *         description: Successfully retrieved companies
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CompanyResponse'
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/companies', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const response = await propertyBaseAdapter.getCompanies()
    ctx.body = { content: response.data, ...metadata }
  })
}
