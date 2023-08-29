/**
 * Self-contained service, ready to be extracted into a micro service if appropriate.
 *
 * All adapters such as database clients etc. should go into subfolders of the service,
 * not in a general top-level adapter folder to avoid service interdependencies (but of
 * course, there are always exceptions).
 */
import KoaRouter from '@koa/router'
import {
  getRentalProperty,
  getRoomTypeWithMaterialOptions,
  getSingleMaterialOption,
  getRoomTypes,
  getMaterialOptionGroup,
  getMaterialOptionGroups,
  getMaterialOption,
  getMaterialChoices,
} from './adapters/rental-property-adapter'
import { getFloorPlanStream } from './adapters/document-adapter'

export const routes = (router: KoaRouter) => {
  router.get('(.*)/rentalproperties/:id/floorplan', async (ctx) => {
    const response = await getFloorPlanStream(ctx.params.id)
    ctx.type = response.headers['content-type']?.toString() ?? 'image/jpeg'
    ctx.body = response.data
  })

  router.get('(.*)/rentalproperties/:id/material-options', async (ctx) => {
    const roomTypes = await getRoomTypeWithMaterialOptions(ctx.params.id)

    ctx.body = roomTypes
  })

  router.get(
    '(.*)/rentalproperties/:id/material-options/details',
    async (ctx) => {
      if (
        ctx.request.query.roomTypeId &&
        ctx.request.query.materialOptionGroupId &&
        ctx.request.query.materialOptionId
      ) {
        const option = await getSingleMaterialOption(
          Math.round(Math.random() * 100000).toString(),
          ctx.request.query.roomTypeId[0],
          ctx.request.query.materialOptionGroupId[0],
          ctx.request.query.materialOptionId[0]
        )

        ctx.body = {
          materialOption: option,
        }
      }
    }
  )

  router.get('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    const materialChoices = await getMaterialChoices(ctx.params.id)

    ctx.body = materialChoices
  })

  router.get('(.*)/rentalproperties/:id/room-types', async (ctx) => {
    const roomTypes = await getRoomTypes(ctx.params.id)

    ctx.body = roomTypes
  })

  router.get('(.*)/rentalproperties/:id', async (ctx) => {
    const responseData = await getRentalProperty(ctx.params.id)

    ctx.body = {
      data: responseData,
    }
  })

  router.get(
    '(.*)/room-types/:roomTypeId/material-option-groups/:optionGroupId',
    async (ctx) => {
      const group = await getMaterialOptionGroup(
        ctx.params.roomTypeId,
        ctx.params.optionGroupId
      )

      ctx.body = group
    }
  )

  router.get(
    '(.*)/room-types/:roomTypeId/material-option-groups',
    async (ctx) => {
      const groups = await getMaterialOptionGroups(ctx.params.roomTypeId)

      ctx.body = groups
    }
  )

  router.get(
    '(.*)/room-types/:roomTypeId/material-option-groups/:optionGroupId/options/:optionId',
    async (ctx) => {
      const option = await getMaterialOption(
        ctx.params.roomTypeId,
        ctx.params.optionGroupId,
        ctx.params.optionId
      )

      ctx.body = option
    }
  )
}
