/*
 * Self-contained service, ready to be extracted into a microservice if appropriate.
 *
 * All adapters such as database clients etc. should go into subfolders of the service,
 * not in a general top-level adapter folder to avoid service interdependencies (but of
 * course, there are always exceptions).
 */
import KoaRouter from '@koa/router'
import { generateRouteMetadata } from 'onecore-utilities'

import * as leasingAdapter from '../../adapters/leasing-adapter'

export const routes = (router: KoaRouter) => {
  /**
   * @swagger
   * /vacant-parkingspaces:
   *   get:
   *     summary: Get all vacant parking spaces
   *     tags:
   *       - Lease service
   *     description: Retrieves a list of all vacant parking spaces.
   *     responses:
   *       '200':
   *         description: A list of vacant parking spaces.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 content:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       rentalObjectCode:
   *                         type: string
   *                       address:
   *                         type: string
   *                       monthlyRent:
   *                         type: number
   *                       propertyCaption:
   *                         type: string
   *                       propertyCode:
   *                         type: string
   *                       residentialAreaCode:
   *                         type: string
   *                       residentialAreaCaption:
   *                         type: string
   *                       objectTypeCaption:
   *                         type: string
   *                       objectTypeCode:
   *                         type: string
   *                       vacantFrom:
   *                         type: string
   *                         format: date-time
   *                       districtCaption:
   *                         type: string
   *                       districtCode:
   *                         type: string
   *                       braArea:
   *                         type: number
   *       '500':
   *         description: Internal server error. Failed to retrieve vacant parking spaces.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   description: Error message.
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/vacant-parkingspaces', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const result = await leasingAdapter.getAllVacantParkingSpaces()
    if (!result.ok) {
      ctx.status = 500
      ctx.body = { error: 'Unknown error', ...metadata }
      return
    }

    ctx.status = 200
    ctx.body = { content: result.data, ...metadata }
  })

  /**
   * @swagger
   * /rental-object/by-code/{rentalObjectCode}:
   *   get:
   *     summary: Get a rental object
   *     description: Fetches a rental object by Rental Object Code.
   *     tags:
   *       - RentalObject
   *     parameters:
   *       - in: path
   *         name: rentalObjectCode
   *         required: true
   *         schema:
   *           type: string
   *         description: The code of the rental object to fetch.
   *     responses:
   *       '200':
   *         description: Successfully retrieved the rental object.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 content:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       rentalObjectCode:
   *                         type: string
   *                       address:
   *                         type: string
   *                       monthlyRent:
   *                         type: number
   *                       propertyCaption:
   *                         type: string
   *                       propertyCode:
   *                         type: string
   *                       residentialAreaCode:
   *                         type: string
   *                       residentialAreaCaption:
   *                         type: string
   *                       objectTypeCaption:
   *                         type: string
   *                       objectTypeCode:
   *                         type: string
   *                       vacantFrom:
   *                         type: string
   *                         format: date-time
   *                       districtCaption:
   *                         type: string
   *                       districtCode:
   *                         type: string
   *                       braArea:
   *                         type: number
   *       '500':
   *         description: Internal server error. Failed to fetch rental object.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   description: The error message.
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/rental-object/by-code/:rentalObjectCode', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const rentalObjectCode = ctx.params.rentalObjectCode
    const result =
      await leasingAdapter.getParkingSpaceByRentalObjectCode(rentalObjectCode)

    if (!result.ok) {
      ctx.status = 500
      ctx.body = { error: 'Unknown error', ...metadata }
      return
    }

    ctx.status = 200
    ctx.body = { content: result.data, ...metadata }
  })
}
