import { ProcessResult, ProcessStatus } from '../../../common/types'
import * as leasingAdapter from '../../../adapters/leasing-adapter'
import * as communicationAdapter from '../../../adapters/communication-adapter'
import { makeProcessError } from '../utils'
import { logger } from 'onecore-utilities'

type ReplyToOfferError =
  | 'no-offer'
  | 'no-contact'
  | 'no-listing'
  | 'send-email'
  | 'unknown'

export const acceptOffer = async (
  offerId: number
): Promise<ProcessResult<null, ReplyToOfferError>> => {
  try {
    //Get offer
    const res = await leasingAdapter.getOfferByOfferId(offerId)
    if (!res.ok) {
      logger.error('Offer not found')
      return makeProcessError('no-offer', 404, {
        message: `The offer ${offerId} does not exist or could not be retrieved.`,
      })
    }
    const offer = res.data

    const log: string[] = [
      `Tackat ja till intern bilplats`,
      `Tidpunkt för ja tack: ${new Date()
        .toISOString()
        .substring(0, 16)
        .replace('T', ' ')}`,
      `Sökande ${offer.offeredApplicant.contactCode} har tackat ja till bilplats ${offer.rentalObjectCode} och erbjudande ${offerId}`,
    ]

    //Get listing
    const listing = await leasingAdapter.getListingByListingId(
      offer.listingId.toString()
    )

    if (!listing || !listing.districtCode) {
      return makeProcessError('no-listing', 404, {
        message: `The listing ${offer.listingId.toString()} cannot be found.`,
      })
    }

    //Get contact - behövs contact senare i flödet?
    // const contact = await leasingAdapter.getContact(
    //   offer.offeredApplicant.nationalRegistrationNumber
    // )
    // if (!contact) {
    //   return makeProcessError('no-contact', 404, {
    //     message: `Applicant ${offer.offeredApplicant.contactCode} could not be retrieved.`,
    //   })
    // }

    //Create lease
    const lease = await leasingAdapter.createLease(
      listing.rentalObjectCode,
      offer.offeredApplicant.contactCode,
      listing.vacantFrom.toISOString(),
      '001'
    )
    log.push(`Kontrakt skapat: ${lease.LeaseId}`)
    log.push(
      'Kontrollera om moms ska läggas på kontraktet. Detta måste göras manuellt innan det skickas för påskrift.'
    )

    //Reset internal waiting list
    const internalWaitingListResult = await leasingAdapter.resetWaitingList(
      offer.offeredApplicant.nationalRegistrationNumber,
      offer.offeredApplicant.contactCode,
      'Bilplats (intern)'
    )
    if (!internalWaitingListResult.ok) {
      log.push(
        'Kunde inte återställa köpoäng för interna bilplatser: ' +
          internalWaitingListResult.err
      )
    }

    //Reset external waiting list
    const externalWaitingListResult = await leasingAdapter.resetWaitingList(
      offer.offeredApplicant.nationalRegistrationNumber,
      offer.offeredApplicant.contactCode,
      'Bilplats (extern)'
    )
    if (!externalWaitingListResult.ok) {
      log.push(
        'Kunde inte återställa köpoäng för externa bilplatser: ' +
          externalWaitingListResult.err
      )
    }

    //send notification to the leasing team
    await communicationAdapter.sendNotificationToRole(
      'leasing',
      'Bilplats tilldelad och kontrakt skapat för intern bilplats',
      log.join('\n')
    )

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 202,
      data: null,
    }
  } catch (err) {
    return makeProcessError('unknown', 500)
  }
}

export const denyOffer = async (
  offerId: number
): Promise<ProcessResult<null, ReplyToOfferError>> => {
  try {
    //Get offer
    const res = await leasingAdapter.getOfferByOfferId(offerId)
    if (!res.ok) {
      logger.error('Offer not found')
      return makeProcessError('no-offer', 404, {
        message: `The offer ${offerId} does not exist or could not be retrieved.`,
      })
    }
    const offer = res.data

    //Get listing
    const listing = await leasingAdapter.getListingByListingId(
      offer.listingId.toString()
    )
    if (!listing || !listing.districtCode) {
      return makeProcessError('no-listing', 404, {
        message: `The listing ${offer.listingId.toString()} cannot be found.`,
      })
    }

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 202,
      data: null,
    }
  } catch (err) {
    return makeProcessError('unknown', 500)
  }
}

export const expireOffer = async (
  offerId: number
): Promise<ProcessResult<null, ReplyToOfferError>> => {
  try {
    //Get offer
    const res = await leasingAdapter.getOfferByOfferId(offerId)
    if (!res.ok) {
      logger.error('Offer not found')
      return makeProcessError('no-offer', 404, {
        message: `The offer ${offerId} does not exist or could not be retrieved.`,
      })
    }
    const offer = res.data

    //Get listing
    const listing = await leasingAdapter.getListingByListingId(
      offer.listingId.toString()
    )
    if (!listing || !listing.districtCode) {
      return makeProcessError('no-listing', 404, {
        message: `The listing ${offer.listingId.toString()} cannot be found.`,
      })
    }

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 200,
      data: null,
    }
  } catch (err) {
    return makeProcessError('unknown', 500)
  }
}
