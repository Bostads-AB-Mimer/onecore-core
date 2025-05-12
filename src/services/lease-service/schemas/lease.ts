import { z } from 'zod'

export const LeaseStatus = z.enum([
  'Current',
  'Upcoming',
  'AboutToEnd',
  'Ended',
])

export const PhoneNumber = z.object({
  phoneNumber: z.string(),
  type: z.string(),
  isMainNumber: z.boolean(),
})

export const Address = z.object({
  street: z.string(),
  number: z.string(),
  postalCode: z.string(),
  city: z.string(),
})

export const ResidentialArea = z.object({
  code: z.string(),
  caption: z.string(),
})

export const MaterialOption = z.object({
  materialOptionId: z.string(),
  caption: z.string(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  roomTypeName: z.string().optional(),
  materialOptionGroupName: z.string().optional(),
})

type MaterialOption = z.infer<typeof MaterialOption>

const BaseMaterialOptionGroup = z.object({
  materialOptionGroupId: z.string(),
  roomTypeId: z.string(),
  roomTypeName: z.string().optional(),
  name: z.string().optional(),
  actionName: z.string().optional(),
  type: z.string(),
})

export type MaterialOptionGroup = z.infer<typeof BaseMaterialOptionGroup> & {
  materialOptions?: MaterialOption[]
  materialChoices?: MaterialChoice[]
}

export const MaterialOptionGroupSchema: z.ZodType<MaterialOptionGroup> =
  BaseMaterialOptionGroup.extend({
    materialOptions: z.array(MaterialOption).optional(),
    materialChoices: z.lazy(() => z.array(MaterialChoiceSchema).optional()),
  })

const BaseMaterialChoice = z.object({
  materialChoiceId: z.string(),
  materialOptionId: z.string(),
  materialOptionGroupId: z.string(),
  apartmentId: z.string(),
  roomTypeId: z.string(),
  materialOption: MaterialOption.optional(),
  roomType: z.lazy(() => RoomType).optional(),
  status: z.string(),
  dateOfSubmission: z.coerce.date().optional(),
  dateOfCancellation: z.coerce.date().optional(),
})

type MaterialChoice = z.infer<typeof BaseMaterialChoice> & {
  materialOptionGroup?: MaterialOptionGroup
}

export const MaterialChoiceSchema: z.ZodType<MaterialChoice> =
  BaseMaterialChoice.extend({
    materialOptionGroup: MaterialOptionGroupSchema.optional(),
  })

export const RoomType = z.object({
  roomTypeId: z.string(),
  name: z.string(),
  materialOptionGroups: z.array(MaterialOptionGroupSchema).optional(),
})

export const RentalProperty = z.object({
  rentalPropertyId: z.string(),
  apartmentNumber: z.number(),
  size: z.number(),
  type: z.string(),
  address: Address.optional(),
  rentalPropertyType: z.string(),
  additionsIncludedInRent: z.string(),
  otherInfo: z.string().optional(),
  roomTypes: z.array(RoomType).optional(),
  lastUpdated: z.coerce.date().optional(),
})

export const Rent = z.object({
  rentId: z.string().optional(),
  leaseId: z.string().optional(),
  currentRent: z.number(),
  vat: z.number(),
  additionalChargeDescription: z.string().optional(),
  additionalChargeAmount: z.number().optional(),
  rentStartDate: z.coerce.date().optional(),
  rentEndDate: z.coerce.date().optional(),
})

export const RentInfo = z.object({
  currentRent: Rent,
  futureRents: z.array(Rent).optional(),
})

export const WaitingList = z.object({
  queueTime: z.coerce.date(),
  queuePoints: z.number(),
  type: z.number(),
})

export const BaseContact = z.object({
  contactCode: z.string(),
  contactKey: z.string(),
  leaseIds: z.array(z.string()).optional(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  nationalRegistrationNumber: z.string(),
  birthDate: z.coerce.date(),
  address: Address.optional(),
  phoneNumbers: z.array(PhoneNumber).optional(),
  emailAddress: z.string().optional(),
  isTenant: z.boolean(),
  parkingSpaceWaitingList: WaitingList.optional(),
  specialAttention: z.boolean().optional(),
})

type Contact = z.infer<typeof BaseContact> & {
  leases?: Lease[]
}

export const ContactSchema = BaseContact.extend({
  leases: z.lazy(() => z.array(LeaseSchema)).optional(),
})

export const BaseLease = z.object({
  leaseId: z.string(),
  leaseNumber: z.string(),
  leaseStartDate: z.coerce.date(),
  leaseEndDate: z.coerce.date().optional(),
  status: LeaseStatus,
  tenantContactIds: z.array(z.string()).optional(),
  rentalPropertyId: z.string(),
  rentalProperty: RentalProperty.optional(),
  type: z.string(),
  rentInfo: RentInfo.optional(),
  address: Address.optional(),
  noticeGivenBy: z.string().optional(),
  noticeDate: z.coerce.date().optional(),
  noticeTimeTenant: z.string().optional(),
  preferredMoveOutDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional(),
  contractDate: z.coerce.date().optional(),
  lastDebitDate: z.coerce.date().optional(),
  approvalDate: z.coerce.date().optional(),
  residentialArea: ResidentialArea.optional(),
})

type Lease = z.infer<typeof BaseLease> & {
  tenants?: Contact[]
}

export const LeaseSchema: z.ZodType<Lease> = BaseLease.extend({
  tenants: z.lazy(() => ContactSchema.array()).optional(),
})
