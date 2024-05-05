import KoaRouter from '@koa/router'
import {
  getContactForPhoneNumber,
  getLease,
  getLeasesForPnr,
  getLeasesForPropertyId,
} from '../../adapters/leasing-adapter'
import { getRentalPropertyInfo } from '../../adapters/property-management-adapter'
import {
  ApartmentInfo,
  CommercialSpaceInfo,
  Lease,
  RentalPropertyInfo,
} from 'onecore-types'
import {
  createTicket,
  getMaintenanceTeamId,
  getTicketByContactCode,
} from './adapters/odoo-adapter'

interface RentalPropertyInfoWithLeases extends RentalPropertyInfo {
  leases: Lease[]
}

export const routes = (router: KoaRouter) => {
  router.get('(.*)/propertyInfo/:number', async (ctx: any) => {
    const responseData: any = []

    const getRentalPropertyInfoWithLeases = async (lease: Lease) => {
      const propertyInfo = await getRentalPropertyInfo(lease.rentalPropertyId)
      const propertyInfoWithLeases: RentalPropertyInfoWithLeases = {
        ...propertyInfo,
        leases: [lease],
      }
      return propertyInfoWithLeases
    }

    try {
      switch (ctx.query.typeOfNumber) {
        // getRentalPropertyInfo can be refactored into separate endpoints for fetching more specific data. From leases we know if the property is an apartment or a parking space or a commercial space.
        // However, fetching property type from leases brings an issue when searching for a property without an active lease.

        case 'rentalPropertyId': {
          const propertyInfo = await getRentalPropertyInfo(ctx.params.number)
          const leases = await getLeasesForPropertyId(
            ctx.params.number,
            undefined,
            'true'
          )
          const propertyInfoWithLeases: RentalPropertyInfoWithLeases = {
            ...propertyInfo,
            leases: leases,
          }
          responseData.push(propertyInfoWithLeases)
          break
        }
        case 'leaseId': {
          const lease = await getLease(
            encodeURIComponent(ctx.params.number),
            'true'
          )
          if (lease) {
            const propertyInfoWithLease =
              await getRentalPropertyInfoWithLeases(lease)
            responseData.push(propertyInfoWithLease)
          }
          break
        }
        case 'pnr': {
          const leases = await getLeasesForPnr(
            ctx.params.number,
            undefined,
            'true'
          )
          if (leases) {
            for (const lease of leases) {
              const propertyInfoWithLease =
                await getRentalPropertyInfoWithLeases(lease)
              responseData.push(propertyInfoWithLease)
            }
          }
          break
        }
        case 'phoneNumber': {
          const contact = await getContactForPhoneNumber(ctx.params.number)
          if (contact) {
            const leases = await getLeasesForPnr(
              contact.nationalRegistrationNumber,
              undefined,
              'true'
            )
            if (leases) {
              for (const lease of leases) {
                const propertyInfoWithLease =
                  await getRentalPropertyInfoWithLeases(lease)
                responseData.push(propertyInfoWithLease)
              }
            }
          }
          break
        }

        default:
          break
      }
    } catch (error) {
      console.log('Error', error)
      ctx.throw(500, 'Internal server error')
    }

    ctx.body = {
      data: responseData,
    }
  })

  router.get('(.*)/ticketsByContactCode/:code', async (ctx: any) => {
    try {
      const tickets = await getTicketByContactCode(ctx.params.code)
      if (tickets && tickets.length > 0) {
        ctx.status = 200
        ctx.body = {
          totalCount: tickets.length,
          workOrders: tickets,
        }
      } else {
        ctx.status = 200
        ctx.body = { message: 'No tickets found' }
        return
      }
    } catch (error) {
      console.error('Error:', error)
      ctx.status = 500
      ctx.body = { message: 'Internal server error' }
      return
    }
  })

  router.post('(.*)/createTicket/:contactCode', async (ctx) => {
    const equipmentList = ['TM', 'MA', 'TT', 'TS']

    try {
      if (!ctx.params.contactCode) {
        ctx.status = 400
        ctx.body = {
          message: 'Contact code is missing. It needs to be passed in the url.',
        }
        return
      }
      const { RentalObjectCode, AccessOptions, Pet, Rows } = ctx.request.body
      const laundryRoomTickets = Rows.filter(
        (row: any) => row.LocationCode === 'TV'
      )

      if (laundryRoomTickets.length === 0) {
        ctx.status = 400
        ctx.body = {
          message: 'Bad request, no laundry room tickets found in request',
        }
        return
      }
      const maintenanceTeamId = await getMaintenanceTeamId(
        'Vitvarureperatör Mimer'
      )

      for (const ticket of laundryRoomTickets) {
        if (equipmentList.includes(ticket.PartOfBuildingCode)) {
          const rentalPropertyInfo =
            await getRentalPropertyInfo(RentalObjectCode)

          const laundryRoom = rentalPropertyInfo.maintenanceUnits?.find(
            (unit) => unit.type.toUpperCase() === 'TVÄTTSTUGA'
          )

          if (!laundryRoom) {
            ctx.status = 400
            ctx.body = {
              message: 'No laundry room found for rental property',
            }
            return
          }

          const ticketId = await createTicket({
            contact_code: ctx.params.contactCode,
            rental_property_id: RentalObjectCode,
            hearing_impaired: AccessOptions.Type === 1,
            phone_number: AccessOptions.PhoneNumber,
            call_between: AccessOptions.CallBetween,
            pet: Pet,
            space_code: ticket.LocationCode,
            equipment_code: ticket.PartOfBuildingCode,
            description: ticket.Description,
            name: 'Felanmäld tvättstuga - ' + ticket.PartOfBuildingCode,
            email_address: AccessOptions.Email,
            building_code: (
              rentalPropertyInfo.property as ApartmentInfo | CommercialSpaceInfo
            ).buildingCode,
            building: (
              rentalPropertyInfo.property as ApartmentInfo | CommercialSpaceInfo
            ).building,
            estate_code: laundryRoom.estateCode,
            estate: laundryRoom.estate,
            code: laundryRoom.code,
            space_caption: laundryRoom.caption,
            maintenance_team_id: maintenanceTeamId,
          })

          ctx.status = 200
          ctx.body = { message: `Ticket created with ID ${ticketId}` }
        }
      }
    } catch (error) {
      console.error('Error creating a new ticket:', error)
      ctx.status = 500
      ctx.body = {
        message: 'Failed to create a new ticket',
      }
    }
  })
}
