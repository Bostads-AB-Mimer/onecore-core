import { Contact, Lease, RentalPropertyInfo } from 'onecore-types'
import { OdooGetTicket } from '../adapters/odoo-adapter'

export const ticketRequestMockData = {
  RentalObjectCode: '705-022-04-0201',
  Images: [],
  AccessOptions: {
    Type: 0,
    Email: 'test@test.se',
    PhoneNumber: '0734567891',
    CallBetween: '08:00 - 17:00',
  },
  Pet: 'Ja, cirka 20-25 katter. Svårt att hålla koll nuförtiden',
  Rows: [
    {
      LocationCode: 'TV',
      PartOfBuildingCode: 'TS',
      Description:
        'Torkskåpet är en portal till en annan värld med ett talade lejon som heter Aslan.',
    },
  ],
}

export const leaseMockData: Lease = {
  leaseId: '123',
  leaseNumber: '9433',
  leaseStartDate: new Date('2023-06-01T09:57:53.144Z'),
  leaseEndDate: new Date('2023-06-01T09:57:53.144Z'),
  status: 0,
  tenantContactIds: ['P4417', 'P5602'],
  address: undefined,
  noticeGivenBy: undefined,
  noticeDate: undefined,
  noticeTimeTenant: undefined,
  preferredMoveOutDate: undefined,
  contractDate: undefined,
  terminationDate: undefined,
  lastDebitDate: undefined,
  approvalDate: undefined,
  tenants: [
    {
      contactCode: 'P4417',
      contactKey: 'ABC',
      firstName: 'Anneli',
      lastName: 'Forsberg',
      nationalRegistrationNumber: '20740522-7848',
      birthDate: new Date('20740522'),
      address: {
        street: 'Gatvägen',
        number: '29',
        postalCode: '72489',
        city: 'Västerås',
      },
      phoneNumbers: [
        {
          isMainNumber: true,
          phoneNumber: '+465480978306',
          type: 'mobile',
        },
        {
          isMainNumber: false,
          phoneNumber: '+460777174972',
          type: 'home',
        },
      ],
      emailAddress: 'test@test.se',
      leaseIds: ['1'],
      leases: undefined,
      fullName: 'Anneli Forsberg',
      isTenant: true,
    },
    {
      contactCode: 'P5602',
      contactKey: 'ABC',
      firstName: 'Berit',
      lastName: 'Holmgren',
      nationalRegistrationNumber: '20850523-6536',
      birthDate: new Date('20850523'),
      address: {
        street: 'Gatvägen',
        number: '29',
        postalCode: '72489',
        city: 'Västerås',
      },
      phoneNumbers: [
        {
          isMainNumber: true,
          phoneNumber: '+467932495313',
          type: 'mobile',
        },
        {
          isMainNumber: false,
          phoneNumber: '+469731498801',
          type: 'home',
        },
      ],
      emailAddress: 'test@test.se',
      leaseIds: ['1'],
      leases: undefined,
      fullName: 'Berit Holmgren',
      isTenant: true,
    },
  ],
  rentalPropertyId: '456',
  rentalProperty: undefined,
  type: 'type',
  rentInfo: undefined,
}

export const contactMockData: Contact = {
  contactCode: 'P965339',
  contactKey: 'DEF',
  firstName: 'Erik',
  lastName: 'Lundberg',
  fullName: 'Erik Lundberg',
  nationalRegistrationNumber: '194512121122',
  birthDate: new Date('1945-12-12T00:00:00.000Z'),
  address: {
    street: 'Gatvägen',
    number: '56',
    postalCode: '72266',
    city: 'Västerås',
  },
  phoneNumbers: [
    {
      isMainNumber: true,
      phoneNumber: '+460759429414',
      type: 'mobile',
    },
    {
      isMainNumber: false,
      phoneNumber: '+465292643751',
      type: 'home',
    },
  ],
  emailAddress: 'erik.lundberg@mimer.nu',
  leaseIds: ['123'],
  leases: undefined,
  isTenant: false,
}

export const rentalPropertyInfoMockData: RentalPropertyInfo = {
  id: '705-022-04-0201',
  type: 'Apartment',
  property: {
    rentalTypeCode: 'KORTTID',
    rentalType: 'Korttidskontrakt',
    address: 'STENTORPSGATAN 9 A',
    code: '0201',
    number: '1101',
    type: '3 rum och kök',
    entrance: '04',
    floor: '2',
    hasElevator: false,
    washSpace: 'B',
    area: 73,
    estateCode: '02301',
    estate: 'KOLAREN 1',
    buildingCode: '705-022',
    building: 'STENTORPSGATAN 7-9',
  },
  maintenanceUnits: [
    {
      id: '_3CF0USZU9PDOQQ',
      rentalPropertyId: '705-022-04-0201',
      code: '705M03',
      caption: 'Miljöbod Ö48 Stentorpsg. 13',
      type: 'Miljöbod',
      estateCode: '02301',
      estate: 'KOLAREN 1',
    },
    {
      id: '_3CF0UQJ76PDOQQ',
      rentalPropertyId: '705-022-04-0201',
      code: '705M02',
      caption: 'Miljöbod Ö47 Stentorpsg. 7-9',
      type: 'Miljöbod',
      estateCode: '02301',
      estate: 'KOLAREN 1',
    },
    {
      id: '_3SB0PK5VC9K1IT',
      rentalPropertyId: '705-022-04-0201',
      code: '705T15',
      caption: 'TVÄTTSTUGA Stentorpsgatan 7 C',
      type: 'Tvättstuga',
      estateCode: '02301',
      estate: 'KOLAREN 1',
    },
  ],
}

export const ticketsMockData: OdooGetTicket[] = [
  {
    id: 4,
    contact_code: 'P174958',
    phone_number: '070-1234567',
    description: '<p>Torktumlaren torkar inte mina kläder.</p>',
    priority: '2',
    pet: 'Nej',
    call_between: '08:00 - 17:00',
    space_code: 'TV',
    equipment_code: 'TT',
    rental_property_id: '705-022-04-0201',
    request_date: '2024-04-24',
    write_date: '2024-04-26 13:21:20',
    stage_id: [1, 'New Request'],
  },
  {
    id: 2,
    contact_code: 'P174958',
    phone_number: '070-1234567',
    description: '<p>Tvättmaskinen är trasig</p>',
    priority: '2',
    pet: 'Nej',
    call_between: '08:00 - 17:00',
    space_code: 'TV',
    equipment_code: 'TM',
    rental_property_id: '705-022-04-0201',
    request_date: '2024-04-24',
    write_date: '2024-04-26 13:21:20',
    stage_id: [1, 'New Request'],
  },
]
