/**
 * Self-contained service, ready to be extracted into a microservice if appropriate.
 *
 * All adapters such as database clients etc. should go into subfolders of the service,
 * not in a general top-level adapter folder to avoid service interdependencies (but of
 * course, there are always exceptions).
 */
import KoaRouter from '@koa/router'
import * as propertyManagementAdapter from '../../adapters/property-management-adapter'
import * as leasingAdapter from '../../adapters/leasing-adapter'
import { getFloorPlanStream } from './adapters/document-adapter'
import { createLeaseForExternalParkingSpace } from '../../processes/parkingspaces/external'
import { createNoteOfInterestForInternalParkingSpace } from '../../processes/parkingspaces/internal'
import { logger, generateRouteMetadata } from 'onecore-utilities'

/**
 * @swagger
 * openapi: 3.0.0
 * tags:
 *   - name: Property management service
 *     description: Operations related to property management
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
   * /rentalproperties/{id}/floorplan:
   *   get:
   *     summary: Get floor plan for a rental property
   *     description: Returns the floor plan image for the specified rental property.
   *     tags:
   *       - Property management service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the rental property.
   *     responses:
   *       200:
   *         description: Successfully retrieved floor plan image
   *         content:
   *           image/jpeg:
   *             schema:
   *               type: string
   *               format: binary
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/rentalproperties/:id/floorplan', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const response = await getFloorPlanStream(ctx.params.id)
    ctx.type = response.headers['content-type']?.toString() ?? 'image/jpeg'
    ctx.body = { content: response.data, ...metadata }
  })

  /**
   * @swagger
   * /rentalproperties/{id}/material-options:
   *   get:
   *     summary: Get room types with material options by rental property ID
   *     tags:
   *       - Property management service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rental property to fetch room types for
   *     responses:
   *       200:
   *         description: Successful response with room types and their material options
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/rentalproperties/:id/material-options', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const roomTypes =
      await propertyManagementAdapter.getRoomTypeWithMaterialOptions(
        ctx.params.id
      )

    ctx.body = { content: roomTypes, ...metadata }
  })

  /**
   * @swagger
   * /rentalproperties/{id}/material-option/{materialOptionId}:
   *   get:
   *     summary: Get material option by ID for a specific rental property
   *     tags:
   *       - Property management service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rental property to fetch material options from
   *       - in: path
   *         name: materialOptionId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the material option to fetch
   *     responses:
   *       '200':
   *         description: Successful response with the requested material option
   *         content:
   *           application/json:
   *             schema:
   *                type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '(.*)/rentalproperties/:id/material-option/:materialOptionId',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const option = await propertyManagementAdapter.getMaterialOption(
        ctx.params.id,
        ctx.params.materialOptionId
      )

      ctx.body = { content: option, ...metadata }
    }
  )

  /**
   * @swagger
   * /rentalproperties/{apartmentId}/{contractId}/material-choices:
   *   get:
   *     summary: Get material choices for a specific apartment and contract
   *     tags:
   *       - Property management service
   *     parameters:
   *       - in: path
   *         name: apartmentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the apartment to fetch material choices for
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the contract to fetch material choices for
   *     responses:
   *       '200':
   *         description: Successful response with the requested material choices
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '(.*)/rentalproperties/:apartmentId/:contractId/material-choices',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const materialChoices =
        await propertyManagementAdapter.getMaterialChoices(
          ctx.params.apartmentId,
          ctx.params.contractId
        )

      ctx.body = { content: materialChoices, ...metadata }
    }
  )

  /**
   * @swagger
   * /rentalproperties/{id}/rooms-with-material-choices:
   *   get:
   *     summary: Get rooms with material choices for a specific rental property
   *     tags:
   *       - Property management service
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rental property to fetch rooms with material choices for
   *     responses:
   *       '200':
   *         description: Successful response with the requested rooms and their material choices
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '(.*)/rentalproperties/:id/rooms-with-material-choices',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      const materialChoices =
        await propertyManagementAdapter.getRoomsWithMaterialChoices(
          ctx.params.id
        )

      ctx.body = { content: materialChoices, ...metadata }
    }
  )

  /**
   * @swagger
   * /rentalproperties/{id}/material-choices:
   *   get:
   *     summary: Get material choices for a specific rental property
   *     tags:
   *       - Property management service
   *     description: Retrieve material choices associated with a rental property identified by {id}.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rental property to fetch material choices for.
   *     responses:
   *       '200':
   *         description: Successful response with the requested material choices
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const materialChoices = await propertyManagementAdapter.getMaterialChoices(
      ctx.params.id
    )

    ctx.body = { content: materialChoices, ...metadata }
  })

  /**
   * @swagger
   * /rentalproperties/material-choice-statuses:
   *   get:
   *     summary: Get material choice statuses for rental properties
   *     tags:
   *       - Property management service
   *     description: Retrieves statuses of material choices associated with rental properties.
   *       Optionally includes rental property details if specified in query parameter.
   *     parameters:
   *       - in: query
   *         name: includeRentalProperties
   *         schema:
   *           type: string
   *           enum: ['true']
   *         description: Optional parameter to include rental property details in response.
   *     responses:
   *       '200':
   *         description: Successful response with material choice statuses
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/rentalproperties/material-choice-statuses', async (ctx) => {
    const metadata = generateRouteMetadata(ctx, ['includeRentalProperties'])
    const materialChoiceStatuses =
      await propertyManagementAdapter.getMaterialChoiceStatuses(
        ctx.params.projectCode
      )

    if (ctx.query.includeRentalProperties === 'true') {
      for (const materialChoiceStatus of materialChoiceStatuses) {
        materialChoiceStatus.rentalProperty =
          await propertyManagementAdapter.getRentalProperty(
            materialChoiceStatus.apartmentId
          )
      }
    }

    ctx.body = { content: materialChoiceStatuses, ...metadata }
  })

  /**
   * @swagger
   * /rentalproperties/{id}/material-choices:
   *   post:
   *     summary: Save material choices for a rental property
   *     tags:
   *       - Property management service
   *     description: Saves material choices for a specific rental property.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rental property to save material choices for.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       '200':
   *         description: Material choices successfully saved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.post('(.*)/rentalproperties/:id/material-choices', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    await propertyManagementAdapter.getMaterialChoices(ctx.params.id)

    if (ctx.request.body) {
      const result = await propertyManagementAdapter.saveMaterialChoice(
        ctx.params.id,
        ctx.request.body
      )

      ctx.body = { content: result, ...metadata }
    }
  })

  /**
   * @swagger
   * /rentalproperties/{id}:
   *   get:
   *     summary: Get rental property by ID
   *     tags:
   *       - Property management service
   *     description: Retrieves details of a rental property based on the provided ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rental property to fetch.
   *     responses:
   *       '200':
   *         description: Successful response with rental property details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/rentalproperties/:id', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const responseData = await propertyManagementAdapter.getRentalProperty(
      ctx.params.id
    )

    ctx.body = {
      content: responseData,
      ...metadata,
    }
  })

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
   *                     $ref: '#/components/schemas/VacantParkingSpace'
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
   * components:
   *   schemas:
   *     VacantParkingSpace:
   *       type: object
   *       description: Represents a vacant parking space.
   */
  router.get('(.*)/vacant-parkingspaces', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const result = await propertyManagementAdapter.getAllVacantParkingSpaces()
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
   * /parkingspaces/{parkingSpaceId}/leases:
   *   post:
   *     summary: Create lease for an external parking space
   *     tags:
   *       - Property management service
   *     description: Creates a new lease for the specified external parking space.
   *     parameters:
   *       - in: path
   *         name: parkingSpaceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the parking space for which the lease is being created.
   *       - in: body
   *         name: Lease details
   *         required: true
   *         description: Lease information including contact ID and start date.
   *         schema:
   *           type: object
   *           required:
   *             - contactId
   *             - startDate
   *           properties:
   *             contactId:
   *               type: string
   *               description: ID of the contact associated with the lease.
   *             startDate:
   *               type: string
   *               format: date-time
   *               description: Start date of the lease.
   *     responses:
   *       '201':
   *         description: Lease successfully created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       '400':
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Parking space id is missing. It needs to be passed in the url.
   *       '500':
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: A technical error has occured.
   *     security:
   *       - bearerAuth: []
   */
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

  /**
   * @swagger
   * /parkingspaces/{parkingSpaceId}/noteofinterests:
   *   post:
   *     summary: Create a note of interest for an internal parking space
   *     tags:
   *       - Property management service
   *     description: Creates a new note of interest for the specified internal parking space.
   *     parameters:
   *       - in: path
   *         name: parkingSpaceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the parking space for which the note of interest is being created.
   *       - in: body
   *         name: Note of Interest details
   *         required: true
   *         description: Note of interest information including contact code and application type.
   *         schema:
   *           type: object
   *           required:
   *             - contactCode
   *           properties:
   *             contactCode:
   *               type: string
   *               description: Code of the contact associated with the note of interest.
   *             applicationType:
   *               type: string
   *               description: Optional. Type of application for the note of interest.
   *     responses:
   *       '201':
   *         description: Note of interest successfully created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       '400':
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Contact code is missing. It needs to be passed in the body (contactCode)
   *       '500':
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: A technical error has occured.
   *     security:
   *       - bearerAuth: []
   */
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

  /**
   * @swagger
   * /rental-object/by-code/{rentalObjectCode}:
   *   get:
   *     summary: Get a rental object
   *     description: Fetches a rental object by Rental Object Code.
   *     tags:
   *       - RentalObject
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
   *                     $ref: '#/components/schemas/RentalObject'
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
   * components:
   *   schemas:
   *     RentalObject:
   *       type: object
   *       description: Represents a rental object.
   */
  router.get('(.*)/rental-object/by-code/:rentalObjectCode', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const rentalObjectCode = ctx.params.rentalObjectCode
    const result =
      await propertyManagementAdapter.getParkingSpaceByRentalObjectCode(
        rentalObjectCode
      )

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
   * /propertyInfoFromXpand/{rentalObjectCode}:
   *   get:
   *     summary: Get rental property information from Xpand
   *     tags:
   *       - Property management service
   *     description: Retrieves detailed information about a rental property from Xpand based on the provided rental object code.
   *     parameters:
   *       - in: path
   *         name: rentalObjectCode
   *         required: true
   *         schema:
   *           type: string
   *         description: Rental object code used to identify the specific rental property in Xpand.
   *     responses:
   *       '200':
   *         description: Successfully retrieved rental property information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *     security:
   *       - bearerAuth: []
   */
  router.get('(.*)/propertyInfoFromXpand/:rentalObjectCode', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    const res = await propertyManagementAdapter.getRentalPropertyInfoFromXpand(
      ctx.params.rentalObjectCode
    )
    ctx.status = res.status
    ctx.body = { content: res.data, ...metadata }
  })

  router.get(
    '(.*)/maintenanceUnits/rentalPropertyId/:rentalPropertyId/:type?',
    async (ctx) => {
      const metadata = generateRouteMetadata(ctx)
      try {
        const maintenanceUnits =
          await propertyManagementAdapter.getMaintenanceUnitsForRentalProperty(
            ctx.params.rentalPropertyId
          )
        if (maintenanceUnits && maintenanceUnits.length > 0) {
          // Filter by type if type is provided
          if (ctx.params.type) {
            ctx.status = 200
            ctx.body = {
              content: maintenanceUnits.filter(
                (unit) =>
                  unit.type.toUpperCase() === ctx.params.type.toUpperCase()
              ),
              ...metadata,
            }
            return
          }
          // Return all maintenance units if no type is provided
          ctx.status = 200
          ctx.body = { content: maintenanceUnits, ...metadata }
        } else {
          ctx.status = 200
          ctx.body = { content: [], reason: 'No maintenance units found' }
          logger.info('No maintenance units found')
          return
        }
      } catch (error) {
        logger.error(error, 'Error retreiving maintenance units by property')
        ctx.status = 500
        ctx.body = { error: 'Internal server error', ...metadata }
        return
      }
    }
  )

  router.get('(.*)/maintenanceUnits/contactCode/:contactCode', async (ctx) => {
    const metadata = generateRouteMetadata(ctx)
    try {
      const leases = await leasingAdapter.getLeasesForContactCode(
        ctx.params.contactCode,
        {
          includeUpcomingLeases: true,
          includeTerminatedLeases: false,
          includeContacts: false,
        }
      )
      const promises = leases
        .filter(
          (lease) =>
            lease.type.toLocaleLowerCase().trimEnd() === 'bostadskontrakt'
        )
        .map((lease) =>
          propertyManagementAdapter.getMaintenanceUnitsForRentalProperty(
            lease.rentalPropertyId
          )
        )

      const maintenanceUnits = await Promise.all(promises).then((units) =>
        units.filter((unit) => unit !== undefined).flat()
      )

      if (maintenanceUnits && maintenanceUnits.length > 0) {
        ctx.status = 200
        ctx.body = { content: maintenanceUnits, ...metadata }
      } else {
        ctx.status = 200
        ctx.body = {
          content: [],
          reason: 'No maintenance units found',
          ...metadata,
        }
        logger.info('No maintenance units found')
        return
      }
    } catch (error) {
      console.error('Error:', error)
      ctx.status = 500
      ctx.body = { error: 'Internal server error', ...metadata }
      return
    }
  })
}
