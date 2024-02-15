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
  getContact,
  getCreditInformation,
} from '../lease-service/adapters/tenant-lease-adapter'
import { getParkingSpace } from './adapters/xpand-adapter'
import { ParkingSpaceApplicationCategory } from '../../common/types'

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

  router.post('(.*)/parkingspaces/:parkingSpaceId/leases', async (ctx) => {
    const parkingSpaceId = ctx.params.parkingSpaceId

    if (!parkingSpaceId) {
      ctx.status = 400
      ctx.body = {
        message:
          'Parking space id is missing. It needs to be passed in the url.',
      }

      return
    }

    const contactId = ctx.request.body.contactId

    if (!contactId) {
      ctx.status = 400
      ctx.body = {
        message:
          'Contact id is missing. It needs to be passed in the body (contactId)',
      }

      return
    }

    let log: string[] = [
      `Ansökan om extern bilplats ${new Date().toISOString()}`,
      `Sökande ${contactId} ansöker om bilplats ${parkingSpaceId}`,
    ]

    try {
      // Step 1. Get parking space, choose process according to type (internal/external)
      const parkingSpace = await getParkingSpace(parkingSpaceId)

      if (!parkingSpace) {
        ctx.status = 404
        ctx.body = {
          message: `The parking space ${parkingSpaceId} does not exist or is no longer available.`,
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
      const applicantContact = await getContact(contactId)

      if (!applicantContact) {
        ctx.status = 500
        ctx.body = {
          message: 'The applicant could not be retrieved.',
        }

        return
      }

      let creditCheck = false

      if (
        !applicantContact.leaseIds ||
        applicantContact.leaseIds.length == 0 ||
        true // testing
      ) {
        // Step 3A. External credit check if applicant is not a tenant.
        /*const creditInformation = getCreditInformation(
          applicantContact.nationalRegistrationNumber
        )*/
        const creditInformation = await getCreditInformation('198001045775')
        creditCheck = creditInformation.status === '1'
        console.log('creditInformation', creditInformation)
        log.push(
          `Extern kreditupplysning genomförd. Resultat: ${creditInformation.status_text}`
        )
      } else {
        // Step 3B. Internal credit check if applicant is a tenant
        creditCheck = true
        log.push(`Internal credit check performed, result: ${creditCheck}`)
      }

      console.log(parkingSpace, applicantContact)

      if (creditCheck) {
        // Step 4A. Create lease
        const lease = await createLease(
          parkingSpace.parkingSpaceId,
          applicantContact.contactCode,
          '2024-01-01',
          '001'
        )

        log.push(`Kontrakt skapat: ${lease.LeaseId}`)

        console.log('lease', lease)
        // Step 5A. Notify of success
        ctx.body = {
          status: 'Success',
          message: 'Parking space lease created.',
          lease: lease,
        }

        console.log('\n\n---\n', log.join('\n'))
      } else {
        // Step 5B. Notify of rejection
        ctx.body = {
          status: 'Failure',
          message: 'The parking space lease application has been rejected',
        }

        log.push(
          `Ansökan kunde inte beviljas på grund av ouppfyllda kreditkrav (se ovan).`
        )
        console.log('\n\n---\n', log.join('\n'))
      }
    } catch (error) {
      // Step 6: Communicate error to dev team and customer service
      console.log('Error', error)
      console.log('\n\n---\n', log.join('\n'))
      ctx.status = 400
      ctx.body = {
        message: 'A technical error has occured',
      }
    }
  })
}
