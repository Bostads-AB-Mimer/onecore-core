/**
 * Self-contained service, ready to be extracted into a microservice if appropriate.
 *
 * All adapters such as database clients etc. should go into subfolders of the service,
 * not in a general top-level adapter folder to avoid service interdependencies (but of
 * course, there are always exceptions).
 */
import KoaRouter from '@koa/router'
import {
  getRentalProperty,
  getRoomTypeWithMaterialOptions,
  getMaterialOption,
  getMaterialChoices,
  saveMaterialChoice,
  getMaterialChoiceStatuses,
  getRoomsWithMaterialChoices,
  getRentalPropertyInfoFromXpand,
} from '../../adapters/property-management-adapter'
import { getFloorPlanStream } from './adapters/document-adapter'
import { createLeaseForExternalParkingSpace } from '../../processes/parkingspaces/external'
import { createNoteOfInterestForInternalParkingSpace } from '../../processes/parkingspaces/internal'
import { logger, generateRouteMetadata } from 'onecore-utilities'

export const routes = (router: KoaRouter) => {
  router.get('(.*)/rentalproperties/:id/floorplan', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const response = await getFloorPlanStream(ctx.params.id)
    ctx.type = response.headers['content-type']?.toString() ?? 'image/jpeg'
    ctx.body = { content: response.data, ...metadata }
  })

  router.get('(.*)/rentalproperties/:id/material-options', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const roomTypes = await getRoomTypeWithMaterialOptions(ctx.params.id)

    ctx.body = { content: roomTypes, ...metadata }
  })

  router.get(
    '(.*)/rentalproperties/:id/material-option/:materialOptionId',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const option = await getMaterialOption(
        ctx.params.id,
        ctx.params.materialOptionId
      )

      ctx.body = { content: option, ...metadata }
    }
  )

  router.get(
    '(.*)/rentalproperties/:apartmentId/:contractId/material-choices',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const materialChoices = await getMaterialChoices(
        ctx.params.apartmentId,
        ctx.params.contractId
      )

      ctx.body = { content: materialChoices, ...metadata }
    }
  )

  router.get(
    '(.*)/rentalproperties/:id/rooms-with-material-choices',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const materialChoices = await getRoomsWithMaterialChoices(ctx.params.id)

      ctx.body = { content: materialChoices, ...metadata }
    }
  )

  router.get('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const materialChoices = await getMaterialChoices(ctx.params.id)

    ctx.body = { content: materialChoices, ...metadata }
  })

  router.get('(.*)/rentalproperties/material-choice-statuses', async (ctx) => {
    const metadata = generateRouteMetadata(ctx, ['includeRentalProperties'])
    const materialChoiceStatuses = await getMaterialChoiceStatuses(
      ctx.params.projectCode
    )

    if (ctx.query.includeRentalProperties === 'true') {
      for (const materialChoiceStatus of materialChoiceStatuses) {
        materialChoiceStatus.rentalProperty = await getRentalProperty(
          materialChoiceStatus.apartmentId
        )
      }
    }

    ctx.body = { content: materialChoiceStatuses, ...metadata }
  })

  router.post('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    await getMaterialChoices(ctx.params.id)

    if (ctx.request.body) {
      const result = await saveMaterialChoice(ctx.params.id, ctx.request.body)

      ctx.body = { content: result, ...metadata }
    }
  })

  router.get('(.*)/rentalproperties/:id', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const responseData = await getRentalProperty(ctx.params.id)

    ctx.body = {
      content: responseData,
      ...metadata,
    }
  })

  router.post('(.*)/parkingspaces/:parkingSpaceId/leases', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const parkingSpaceId = ctx.params.parkingSpaceId

    if (!parkingSpaceId) {
      ctx.status = 400
      ctx.body = {
        message:
          'Parking space id is missing. It needs to be passed in the url.',
        ...metadata,
      }

      return
    }

    const contactId = ctx.request.body.contactId

    if (!contactId) {
      ctx.status = 400
      ctx.body = {
        reason:
          'Contact id is missing. It needs to be passed in the body (contactId)',
        ...metadata,
      }

      return
    }

    const startDate = ctx.request.body.startDate

    try {
      const result = await createLeaseForExternalParkingSpace(
        parkingSpaceId,
        contactId,
        startDate
      )

      ctx.status = result.httpStatus
      ctx.body = { content: result.response, ...metadata }
    } catch (error) {
      // Step 6: Communicate error to dev team and customer service
      logger.error(error, 'Error')
      ctx.status = 500
      ctx.body = {
        error: 'A technical error has occured',
        ...metadata,
      }
    }
  })

  router.post(
    '(.*)/parkingspaces/:parkingSpaceId/noteofinterests',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const parkingSpaceId = ctx.params.parkingSpaceId

      const contactCode = ctx.request.body.contactCode

      if (!contactCode) {
        ctx.status = 400
        ctx.body = {
          reason:
            'Contact code is missing. It needs to be passed in the body (contactCode)',
          ...metadata,
        }
        return
      }

      const applicationType = ctx.request.body.applicationType
      if (applicationType && applicationType == '') {
        ctx.status = 400
        ctx.body = {
          reason:
            'Application type is missing. It needs to be passed in the body (applicationType)',
          ...metadata,
        }
        return
      }

      try {
        const result = await createNoteOfInterestForInternalParkingSpace(
          parkingSpaceId,
          contactCode,
          applicationType
        )

        ctx.status = result.httpStatus
        ctx.body = { content: result.response, ...metadata }
      } catch (err) {
        // Step 6: Communicate error to dev team and customer service
        logger.error({ err }, 'Error when creating note of interest')
        ctx.status = 500
        ctx.body = {
          error: 'A technical error has occured',
          ...metadata,
        }
      }
    }
  )

  router.get('(.*)/propertyInfoFromXpand/:rentalObjectCode', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const res = await getRentalPropertyInfoFromXpand(
      ctx.params.rentalObjectCode
    )
    ctx.status = res.status
    ctx.body = { content: res.data, ...metadata }
  })
}
