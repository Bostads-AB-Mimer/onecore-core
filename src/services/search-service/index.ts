import KoaRouter from '@koa/router'
import { generateRouteMetadata, logger } from 'onecore-utilities'
import { z } from 'zod'

import * as propertyBaseAdapter from '../../adapters/property-base-adapter'

/**
 * @swagger
 * openapi: 3.0.0
 * tags:
 *   - name: Search Service
 *     description: Operations related to searching entities in the system
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * security:
 *   - bearerAuth: []
 */
export const routes = (router: KoaRouter) => {
  /**
   * @swagger
   * /search:
   *   get:
   *     tags:
   *       - Search Service
   *     summary: Omni-search for different entities
   *     description: Search for properties, buildings, and more.
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 3
   *         description: The search query string
   *     responses:
   *       200:
   *         description: A list of search results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 content:
   *                   type: array
   *                   items:
   *                     oneOf:
   *                       - type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           type:
   *                             type: string
   *                             enum: ['building']
   *                           name:
   *                             type: string
   *                         required: ['id', 'type']
   *                       - type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           type:
   *                             type: string
   *                             enum: ['property']
   *                           name:
   *                             type: string
   *                         required: ['id', 'type', 'name']
   *       500:
   *         description: Internal server error.
   */
  const SearchQueryParamsSchema = z.object({
    q: z.string().min(3),
  })

  router.get('(.*)/search', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const queryParams = SearchQueryParamsSchema.safeParse(ctx.query)

    if (!queryParams.success) {
      ctx.status = 400
      ctx.body = { errors: queryParams.error.errors }
      return
    }

    logger.info(`GET /search?q=${queryParams.data.q}`, metadata)

    const getProperties = await propertyBaseAdapter.searchProperties(
      queryParams.data.q
    )

    const getBuildings = await propertyBaseAdapter.searchProperties(
      queryParams.data.q
    )

    if (!getProperties.ok || !getBuildings.ok) {
      ctx.status = 500
      return
    }

    ctx.status = 200
    ctx.body = {
      ...metadata,
      content: [...getProperties.data, ...getBuildings.data],
    }
  })
}
