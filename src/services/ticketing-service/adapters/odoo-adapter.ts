import Odoo from 'odoo-await'
import Config from '../../../common/config'

export interface OdooGetTicket {
  uuid: string
  id: number
  phone_number: string
  name: string
  contact_code: string
  description: string
  priority: string
  pet: string
  call_between: string
  space_code: string
  equipment_code: string
  rental_property_id: string
  create_date: string
  write_date: string
  stage_id: [number, string]
}

// TODO: Add a type for the ticket in onecore-types
export interface OdooPostTicket {
  contact_code: string
  rental_property_id: string
  hearing_impaired: boolean
  phone_number: string
  call_between: string
  pet: string
  space_code: string
  equipment_code: string
  description: string
  name: string
  email_address: string
  building_code: string
  building: string
  estate_code: string
  estate: string
  code: string
  space_caption: string
  maintenance_team_id: number
  tenant_id: string
  national_registration_number: string
  address: string
  maintenance_unit_code: string
  maintenance_unit_caption: string
}

const odoo = new Odoo({
  baseUrl: Config.ticketingService.url,
  db: Config.ticketingService.database,
  username: Config.ticketingService.username,
  password: Config.ticketingService.password,
})

const spaceCodes: Record<string, string> = {
  TV: 'Tvättstuga',
}

const equipmentCodes: Record<string, string> = {
  TM: 'Tvättmaskin',
  TT: 'Torktumlare',
  TS: 'Torkskåp',
  MA: 'Mangel',
}

const transformSpaceCode = (space_code: string) => {
  return spaceCodes[space_code] != undefined ? spaceCodes[space_code] : ''
}

const transformEquipmentCode = (equipment_code: string) => {
  return equipmentCodes[equipment_code] != undefined
    ? equipmentCodes[equipment_code]
    : ''
}

const removePTags = (text: string): string => text.replace(/<\/?p>/g, '')

const transformTicket = (ticket: OdooGetTicket) => {
  const spaceCode = transformSpaceCode(ticket.space_code)
  const equipmentCode = transformEquipmentCode(ticket.equipment_code)
  const description = removePTags(ticket.description)

  return {
    AccessCaption: 'Huvudnyckel',
    Caption:
      spaceCode && equipmentCode
        ? `WEBB: ${spaceCode}, ${equipmentCode}`
        : `WEBB: ${ticket.name}`,
    Code: 'od-' + ticket.id,
    ContactCode: ticket.contact_code,
    Description:
      spaceCode && equipmentCode
        ? `${spaceCode}, ${equipmentCode}: `
        : ticket.name +
          ` ${description}\r\nHusdjur: ${ticket.pet}\r\n Kund nås enklast mellan ${ticket.call_between} \r\n på telefonnummer: ${ticket.phone_number}.`,
    DetailsCaption:
      spaceCode && equipmentCode
        ? `${spaceCode}, ${equipmentCode}`
        : ticket.name + `: ${description}`,
    ExternalResource: false,
    Id: ticket.uuid,
    LastChange: ticket.write_date || ticket.create_date,
    Priority: ticket.priority || '',
    Registered: ticket.create_date,
    RentalObjectCode: ticket.rental_property_id,
    Status: ticket.stage_id[1],
    UseMasterKey: true,
    WorkOrderRows: [
      {
        Description: ticket.description,
        LocationCode: spaceCode,
        EquipmentCode: equipmentCode,
      },
    ],
  }
}

const getTicketByContactCode = async (contactCode: string): Promise<any> => {
  await odoo.connect()

  const domain: any[] = [['contact_code', '=', contactCode]]

  const fields: string[] = [
    'uuid',
    'contact_code',
    'name',
    'description',
    'priority',
    'pet',
    'call_between',
    'space_code',
    'equipment_code',
    'rental_property_id',
    'create_date',
    'write_date',
    'stage_id',
    'phone_number',
    'maintenance_unit_code',
    'maintenance_unit_caption',
  ]

  const tickets: OdooGetTicket[] = await odoo.searchRead(
    'maintenance.request',
    domain,
    fields
  )

  return tickets.map(transformTicket)
}

const createTicket = async (ticket: OdooPostTicket): Promise<number> => {
  await odoo.connect()
  return await odoo.create('maintenance.request', ticket)
}

const getMaintenanceTeamId = async (teamName: string): Promise<number> => {
  await odoo.connect()

  const team: number[] = await odoo.search('maintenance.team', {
    name: teamName,
  })

  return team[0]
}

export {
  createTicket,
  getTicketByContactCode,
  getMaintenanceTeamId,
  transformEquipmentCode,
}
