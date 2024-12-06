import { Factory } from 'fishery'
import { Tenant, LeaseStatus } from 'onecore-types'

export const TenantFactory = Factory.define<Tenant>(({ sequence }) => ({
  contactCode: `P${158769 + sequence}`,
  contactKey: 'ABC',
  address: {
    street: 'Gata',
    number: '2',
    postalCode: '54321',
    city: 'Västerås',
  },
  birthDate: new Date(),
  firstName: 'Test',
  lastName: 'Testsson',
  fullName: 'Test Testsson',
  nationalRegistrationNumber: '199404084924',
  phoneNumbers: [
    {
      phoneNumber: '070000000',
      type: 'mobil',
      isMainNumber: true,
    },
  ],
  emailAddress: 'test@mimer.nu',
  leaseIds: [`987-654-321/${sequence}`, `123-456-789/${sequence}`],
  currentHousingContract: {
    leaseId: `123-456-789/${sequence}`,
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
    status: LeaseStatus.Current,
    tenantContactIds: [`P${158769 + sequence}`],
    tenants: undefined,
    terminationDate: undefined,
    type: 'Bostadskontrakt',
  },
  parkingSpaceContracts: [
    {
      leaseId: `987-654-321/${sequence}`,
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
      status: LeaseStatus.Current,
      tenantContactIds: [`P${158769 + sequence}`],
      tenants: undefined,
      terminationDate: undefined,
      type: 'P-Platskontrakt',
    },
  ],
  housingContracts: [
    {
      leaseId: `123-456-789/${sequence}`,
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
      status: LeaseStatus.Current,
      tenantContactIds: [`P${158769 + sequence}`],
      tenants: undefined,
      terminationDate: undefined,
      type: 'Bostadskontrakt',
    },
  ],
}))
