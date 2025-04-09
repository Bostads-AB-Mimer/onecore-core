import KoaRouter from '@koa/router'

import * as propertyBaseAdapter from '../../adapters/property-base-adapter'

import { logger, generateRouteMetadata } from 'onecore-utilities'
import { registerSchema } from '../../utils/openapi'
import * as schemas from './schemas'

/**
 * @swagger
 * openapi: 3.0.0
 * tags:
 *   - name: Property base Service
 *     description: Operations related to property base
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
  registerSchema('ResidenceDetails', schemas.ResidenceDetailsSchema)
  registerSchema('Staircase', schemas.StaircaseSchema)

  /**
   * @swagger
   * /propertyBase/residence/{residenceId}:
   *   get:
   *     summary: Get residence data by residenceId
   *     tags:
   *       - Property base Service
   *     description: Retrieves residence data by residenceId
   *     parameters:
   *       - in: path
   *         name: residenceId
   *         required: true
   *         schema:
   *           type: string
   *         description: Id for the residence to fetch
   *     responses:
   *       '200':
   *         description: Successfully retrieved residence.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 content:
   *                   $ref: '#/components/schemas/ResidenceDetails'
   *       '404':
   *         description: Residence not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Residence not found
   *       '500':
   *         description: Internal server error. Failed to retrieve residence data.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Internal server error
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/propertyBase/residence/:residenceId', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const { residenceId } = ctx.params

    try {
      const result = await propertyBaseAdapter.getResidenceDetails(residenceId)
      if (!result.ok) {
        if (result.err === 'not-found') {
          ctx.status = 404
          ctx.body = { error: 'Residence not found', ...metadata }
          return
        }

        logger.error(result.err, 'Internal server error', metadata)
        ctx.status = 500
        ctx.body = { error: 'Internal server error', ...metadata }
        return
      }

      ctx.body = {
        content: result.data,
        ...metadata,
      }
    } catch (error) {
      logger.error(error, 'Internal server error', metadata)
      ctx.status = 500
      ctx.body = { error: 'Internal server error', ...metadata }
    }
  })

  /**
   * @swagger
   * /propertyBase/staircases:
   *   get:
   *     summary: Get staircases for a building
   *     tags:
   *       - Property base Service
   *     description: Retrieves staircases for a building
   *     parameters:
   *       - in: query
   *         name: buildingCode
   *         required: true
   *         schema:
   *           type: string
   *         description: Code for the building to fetch staircases for
   *     responses:
   *       '200':
   *         description: Successfully retrieved staircases.
   *         content:
   *           application/json:
   *             schema:
   *              type: array
   *              items:
   *                type: object
   *                properties:
   *                  content:
   *                    $ref: '#/components/schemas/Staircase'
   *       '400':
   *         description: Missing buildingCode
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Missing buildingCode
   *       '500':
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Internal server error
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/propertyBase/staircases', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const queryParams = schemas.StaircasesQueryParamsSchema.safeParse(ctx.query)
    if (!queryParams.success) {
      ctx.status = 400
      ctx.body = { errors: queryParams.error.errors }
      return
    }
    const { buildingCode } = queryParams.data

    try {
      const result = await propertyBaseAdapter.getStaircases(
        buildingCode as string
      )
      if (!result.ok) {
        logger.error(result.err, 'Internal server error', metadata)
        ctx.status = 500
        ctx.body = { error: 'Internal server error', ...metadata }
        return
      }

      ctx.body = {
        content: result.data,
        ...metadata,
      }
    } catch (error) {
      logger.error(error, 'Internal server error', metadata)
      ctx.status = 500
      ctx.body = { error: 'Internal server error', ...metadata }
    }
  })
}
