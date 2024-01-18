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
} from './adapters/rental-property-adapter'
import { getFloorPlanStream } from './adapters/document-adapter'

export const routes = (router: KoaRouter) => {
  router.get('(.*)/rentalproperties/:id/floorplan', async (ctx) => {
    const response = await getFloorPlanStream(ctx.params.id)
    ctx.type = response.headers['content-type']?.toString() ?? 'image/jpeg'
    ctx.body = response.data
  })

  router.get('(.*)/rentalproperties/:id/material-options', async (ctx) => {
    return await getRoomTypeWithMaterialOptions(ctx.params.id)
  })

  router.get(
    '(.*)/rentalproperties/:id/material-option/:materialOptionId',
    async (ctx) => {
      ctx.body = await getMaterialOption(
        ctx.params.id,
        ctx.params.materialOptionId
      )
    }
  )

  router.get(
    '(.*)/rentalproperties/:apartmentId/:contractId/material-choices',
    async (ctx) => {
      ctx.body =  getMaterialChoices(
        ctx.params.apartmentId,
        ctx.params.contractId
      )
    }
  )

  router.get(
    '(.*)/rentalproperties/:id/rooms-with-material-choices',
    async (ctx) => {
      ctx.body = await getRoomsWithMaterialChoices(ctx.params.id)
    }
  )

  router.get('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    ctx.body =  await getMaterialChoices(ctx.params.id)
  })

  router.get('(.*)/rentalproperties/material-choice-statuses', async (ctx) => {
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

    ctx.body = materialChoiceStatuses
  })

  router.post('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    await getMaterialChoices(ctx.params.id)

    if (ctx.request.body) {
      ctx.body =  await saveMaterialChoice(ctx.params.id, ctx.request.body)
    }
  })

  router.get('(.*)/rentalproperties/:id', async (ctx) => {
    const responseData = await getRentalProperty(ctx.params.id)

    ctx.body = {
      data: responseData,
    }
  })
}
