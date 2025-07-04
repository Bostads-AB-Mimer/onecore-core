/*
 * Self-contained service, ready to be extracted into a microservice if appropriate.
 *
 * All adapters such as database clients etc. should go into subfolders of the service,
 * not in a general top-level adapter folder to avoid service interdependencies (but of
 * course, there are always exceptions).
 */
import KoaRouter from '@koa/router'
import { generateRouteMetadata } from 'onecore-utilities'
import { z } from 'zod'

import * as leasingAdapter from '../../adapters/leasing-adapter'
import { Listing, RentalObject } from 'onecore-types'
import { logger, loggedAxios as axios } from 'onecore-utilities'

export const routes = (router: KoaRouter) => {
  /**
   * @swagger
   * /listings:
   *   get:
   *     summary: Get listings
   *     tags:
   *       - Lease service
   *     description: Retrieves a list of listings.
   *     parameters:
   *       - in: query
   *         name: listingCategory
   *         required: false
   *         schema:
   *           type: string
   *         description: The listing category, either PARKING_SPACE, APARTMENT or STORAGE.
   *       - in: query
   *         name: published
   *         required: false
   *         schema:
   *           type: boolean
   *         description: true for published listings, false for unpublished listings.
   *       - in: query
   *         name: rentalRule
   *         required: false
   *         schema:
   *           type: string
   *         description: The rental rule for the listings, either SCORED or NON_SCORED.
   *       - in: query
   *         name: validToRentForContactCode
   *         required: false
   *         schema:
   *           type: string
   *         description: A contact code to filter out listings that are not valid to rent for the contact.
   *     responses:
   *       '200':
   *         description: Successful response with the requested list of listings.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/listings', async (ctx) => {
    try {
      const metadata = generateRouteMetadata(ctx)

      const querySchema = z.object({
        listingCategory: z
          .enum(['PARKING_SPACE', 'APARTMENT', 'STORAGE'])
          .optional(),
        published: z
          .enum(['true', 'false'])
          .optional()
          .transform((value) => (value ? value === 'true' : undefined)),
        rentalRule: z.enum(['SCORED', 'NON_SCORED']).optional(),
        validToRentForContactCode: z.string().optional(),
      })
      const query = querySchema.safeParse(ctx.query)

      const result = await leasingAdapter.getListings({
        listingCategory: query.data?.listingCategory,
        published: query.data?.published,
        rentalRule: query.data?.rentalRule,
        validToRentForContactCode: query.data?.validToRentForContactCode,
      })

      if (!result.ok) {
        ctx.status = 500
        ctx.body = { error: 'Error getting listings from leasing', ...metadata }
        return
      }

      const parkingSpacesResult = await leasingAdapter.getParkingSpaces(
        result.data.map((listing) => listing.rentalObjectCode)
      )
      if (!parkingSpacesResult.ok) {
        parkingSpacesResult.err === 'not-found'
          ? (ctx.status = 404)
          : (ctx.status = 500)
        ctx.body = {
          error: 'Error getting parking spaces from leasing',
          ...metadata,
        }
        return
      }

      //TODO flytta til leasing när adaptern flyttats från property-mgmt
      const listingsWithRentalObjects: Listing[] = result.data
        .map((listing) => {
          const rentalObject = parkingSpacesResult.data.find(
            (ps) => ps.rentalObjectCode === listing.rentalObjectCode
          )
          if (!rentalObject) return undefined
          listing.rentalObject = rentalObject
          return listing
        })
        .filter((item): item is Listing => !!item)

      ctx.status = 200
      ctx.body = { content: listingsWithRentalObjects, ...metadata }
    } catch (error) {
      logger.error(error, 'Error fetching listings with rental objects')
      ctx.status = 500
    }
  })

  interface ListingWithRentalObject extends Listing {
    rentalObject: RentalObject
  }
}
