import {
  ConsumerReport,
  Contact,
  Lease,
  LeaseStatus,
  ParkingSpace,
  ParkingSpaceApplicationCategory,
  ParkingSpaceType,
} from 'onecore-types'

export const mockedParkingSpace: ParkingSpace = {
  parkingSpaceId: '123-456-789/0',
  address: {
    street: 'Gatan',
    number: '1',
    postalCode: '12345',
    city: 'Västerås',
  },
  rent: {
    currentRent: {
      currentRent: 123,
      vat: 0,
      rentStartDate: undefined,
      rentEndDate: undefined,
      additionalChargeAmount: undefined,
      additionalChargeDescription: undefined,
    },
    futureRents: undefined,
  },
  type: ParkingSpaceType.Garage,
  applicationCategory: ParkingSpaceApplicationCategory.external,
  vacantFrom: new Date(),
}

export const mockedApplicantWithoutLeases: Contact = {
  contactCode: 'P12345',
  contactKey: 'ABC',
  address: {
    street: 'Gata',
    number: '2',
    postalCode: '54321',
    city: 'Västerås',
  },
  birthDate: new Date(),
  firstName: 'Foo',
  lastName: 'Bar',
  fullName: 'Foo Bar',
  nationalRegistrationNumber: '1212121212',
  phoneNumbers: [],
  emailAddress: 'test@mimer.nu',
  isTenant: true,
}

export const mockedApplicantWithoutAddress: any = {
  contactCode: 'P12345',
  contactKey: 'ABC',
  address: {
    street: null,
    number: null,
    postalCode: null,
    city: null,
  },
  birthDate: new Date(),
  firstName: 'Foo',
  lastName: 'Bar',
  fullName: 'Foo Bar',
  nationalRegistrationNumber: '1212121212',
  phoneNumbers: [],
  emailAddress: 'test@mimer.nu',
  isTenant: true,
}

export const mockedApplicantWithLeases: Contact = {
  leaseIds: ['123-456-789/01', '789-456-123/02'],
  ...mockedApplicantWithoutLeases,
}

export const successfulConsumerReport: ConsumerReport = {
  pnr: '1212121212',
  template: 'template',
  address: 'address',
  city: 'city',
  status: '1',
  errorList: [],
  name: 'Tolvan Tolvansson',
  status_text: 'Godkänd',
  zip: '12345',
}

export const failedConsumerReport: ConsumerReport = {
  pnr: '1212121212',
  template: 'template',
  address: 'address',
  city: 'city',
  status: '2',
  errorList: [
    {
      Cause_of_Reject: 'P24',
      Reject_comment: '',
      Reject_text: 'Scoring',
    },
  ],
  name: 'Tolvan Tolvansson',
  status_text: 'Ej Godkänd',
  zip: '12345',
}

export const mockedLease: Lease = {
  leaseId: '123-456-789/0',
  address: {
    street: 'Gatustigen',
    number: '123',
    city: 'Västerås',
    postalCode: '12345',
  },
  approvalDate: undefined,
  contractDate: undefined,
  lastDebitDate: undefined,
  leaseEndDate: undefined,
  leaseNumber: '123',
  leaseStartDate: new Date(),
  noticeDate: undefined,
  noticeGivenBy: 'tenant',
  noticeTimeTenant: '',
  preferredMoveOutDate: undefined,
  rentalProperty: undefined,
  rentalPropertyId: '123-456-789',
  rentInfo: {
    currentRent: {
      currentRent: 123,
      additionalChargeAmount: undefined,
      additionalChargeDescription: undefined,
      rentEndDate: undefined,
      rentStartDate: undefined,
      vat: 0,
    },
    futureRents: undefined,
  },
  status: LeaseStatus.Active,
  tenantContactIds: ['P12345'],
  tenants: undefined,
  terminationDate: undefined,
  type: '',
}
