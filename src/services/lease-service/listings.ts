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
   *         name: published
   *         required: false
   *         schema:
   *           type: boolean
   *         description: true for published listings, false for unpublished listings.
   *       - in: query
   *         name: waitingListType
   *         required: false
   *         schema:
   *           type: string
   *         description: ie "Bilplats (Intern)" or "Bilplats (Extern)".
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
    const metadata = generateRouteMetadata(ctx)

    const querySchema = z.object({
      published: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => (value ? value === 'true' : undefined)),
      rentalRule: z.enum(['Scored', 'NonScored']).optional(),
      validToRentForContactCode: z.string().optional(),
    })
    const query = querySchema.safeParse(ctx.query)

    const result = await leasingAdapter.getListings(
      query.data?.published,
      query.data?.rentalRule
    )

    //todo: append parking space by retrieving rental object from property management adapter

    if (!result.ok) {
      ctx.status = 500
      ctx.body = { error: 'Unknown error', ...metadata }
      return
    }

    ctx.status = 200
    ctx.body = { content: result.data, ...metadata }
  })
}
