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
import {
  createLease,
  getContactForPnr,
} from '../lease-service/adapters/tenant-lease-adapter'
import { getParkingSpace } from './adapters/xpand-adapter'
import { ParkingSpaceApplicationCategory } from '../../common/types'
import app from '../../app'

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
    '(.*)/rentalproperties/:id/material-option/:materialOptionId',
    async (ctx) => {
      const option = await getMaterialOption(
        ctx.params.id,
        ctx.params.materialOptionId
      )

      ctx.body = option
    }
  )

  router.get(
    '(.*)/rentalproperties/:apartmentId/:contractId/material-choices',
    async (ctx) => {
      const materialChoices = await getMaterialChoices(
        ctx.params.apartmentId,
        ctx.params.contractId
      )

      ctx.body = materialChoices
    }
  )

  router.get(
    '(.*)/rentalproperties/:id/rooms-with-material-choices',
    async (ctx) => {
      const materialChoices = await getRoomsWithMaterialChoices(ctx.params.id)

      ctx.body = materialChoices
    }
  )

  router.get('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    const materialChoices = await getMaterialChoices(ctx.params.id)

    ctx.body = materialChoices
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
      const result = await saveMaterialChoice(ctx.params.id, ctx.request.body)

      ctx.body = result
    }
  })

  router.get('(.*)/rentalproperties/:id', async (ctx) => {
    const responseData = await getRentalProperty(ctx.params.id)

    ctx.body = {
      data: responseData,
    }
  })

  router.post('(.*)/parkingspaces/:id/leases', async (ctx) => {
    if (!ctx.params.id) {
      ctx.status = 400
      ctx.body = {
        message:
          'Parking space id is missing. It needs to be passed in the url.',
      }

      return
    }

    if (!ctx.request.body.contactId) {
      ctx.status = 400
      ctx.body = {
        message:
          'Contact id is missing. It needs to be passed in the body (contactId.)',
      }

      return
    }

    try {
      // Step 1. Get parking space, choose process according to type (internal/external)
      const parkingSpace = await getParkingSpace(ctx.params.id)

      if (!parkingSpace) {
        ctx.status = 404
        ctx.body = {
          message: 'The parking spot does not exist or is no longer available.',
        }

        return
      }

      if (
        parkingSpace.applicationCategory !=
        ParkingSpaceApplicationCategory.external
      ) {
        ctx.status = 400
        ctx.body = {
          message:
            'This route currently only handles external parking spaces. The parking space provided is not external.',
        }

        return
      }

      // Step 2. Get information about applicant and contracts
      const applicantContact = await getContactForPnr(
        ctx.request.body.contactId
      )

      if (!applicantContact) {
        ctx.status = 400
        ctx.body = {
          message: 'The applicant could not be retrieved.',
        }

        return
      }

      let creditCheck = false

      if (!applicantContact.leaseIds || applicantContact.leaseIds.length == 0) {
        // Step 3A. External credit check if applicant is not a tenant.
        creditCheck = true
      } else {
        // Step 3B. Internal credit check if applicant is a tenant
        creditCheck = true
      }

      console.log(parkingSpace, applicantContact)

      if (creditCheck) {
        // Step 4A. Create lease
        const lease = await createLease(
          parkingSpace.parkingSpaceId,
          applicantContact.contactId,
          '2024-01-01',
          '001'
        )

        console.log('lease', lease)
        // Step 5A. Notify of success
        ctx.body = {
          status: 'Success',
          message: 'Parking space lease created.',
          lease: lease,
        }
      } else {
        // Step 5B. Notify of rejection
        ctx.body = {
          status: 'Failure',
          message: 'The parking space lease application has been rejected',
        }
      }
    } catch (error) {
      // Step 6: Communicate error to dev team and customer service
      console.log('Error', error)
      ctx.status = 400
      ctx.body = {
        message: 'A technical error has occured',
      }
    }
  })
}
