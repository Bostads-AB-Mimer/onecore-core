import { ListingStatus, OfferStatus } from 'onecore-types'

import { ProcessResult, ProcessStatus } from '../../../common/types'
import * as leasingAdapter from '../../../adapters/leasing-adapter'

export const createOfferForInternalParkingSpace = async (
  listingId: string
): Promise<ProcessResult> => {
  const log: string[] = [
    `Skapa erbjudande för intern bilplats`,
    `Tidpunkt: ${new Date().toISOString().substring(0, 16).replace('T', ' ')}`,
    `Erbjudande ska skapas för annons-ID ${listingId}`,
  ]

  try {
    // step 0 - validation: listing is no longer published and status is AdvertisementEnded
    const listing = await leasingAdapter.getListingByListingId(listingId)
    if (!listing) throw new Error('no listing')
    // What is ListingStatus?
    if (listing.status !== ListingStatus.Expired)
      throw new Error('listing not expired')

    // step 1 - get list of applicants
    // step 2 - sort applicants by rental criteria
    // step 3 - check for valid applicants
    const applicants =
      (await leasingAdapter.getListingByIdWithDetailedApplicants(
        String(listing.id)
      )) ?? []

    const [applicant] = applicants
    if (!applicant) throw new Error('no applicant')

    // step 3a - create offer
    await leasingAdapter.createOffer({
      applicantId: applicant.id,
      expiresAt: new Date(),
      listingId: listing.id,
      selectedApplicants: applicants,
      status: OfferStatus.Active,
    })

    // step 4 - update status of winning applicant
    await leasingAdapter.updateApplicantStatus({
      applicantId: applicant.id,
      contactCode: applicant.contactCode,
      status: 6, // TODO: Update to ApplicantStatus.Offered once available
    })

    // step 5 - notify winning applicant

    return {
      processStatus: ProcessStatus.inProgress,
      httpStatus: 500,
      response: {
        message: 'WIP',
      },
    }
  } catch (error: any) {
    return {
      processStatus: ProcessStatus.failed,
      httpStatus: 500,
      response: {
        message: error.message,
      },
    }
  }
}
