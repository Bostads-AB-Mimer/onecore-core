import { Factory } from 'fishery'
import { Offer, OfferStatus } from 'onecore-types'

import { DetailedApplicantFactory } from './detailed-applicant'

export const OfferFactory = Factory.define<Offer>(({ sequence }) => ({
  answeredAt: null,
  expiresAt: new Date(),
  id: sequence,
  listingId: 1,
  //TODO: offeredApplicant is not a detailed applicant
  offeredApplicant: DetailedApplicantFactory.build(),
  selectedApplicants: [],
  sentAt: null,
  status: OfferStatus.Active,
  createdAt: new Date(),
}))
