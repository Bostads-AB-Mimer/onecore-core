import {
  ListingStatus,
  OfferStatus,
  OfferWithRentalObjectCode,
  ReplyToOfferErrorCodes,
  WaitingListType,
} from 'onecore-types'
import { logger } from 'onecore-utilities'

import {
  ProcessError,
  ProcessResult,
  ProcessStatus,
} from '../../../common/types'
import * as leasingAdapter from '../../../adapters/leasing-adapter'
import * as communicationAdapter from '../../../adapters/communication-adapter'
import { makeProcessError } from '../utils'
import { AdapterResult } from '../../../adapters/types'
import { createOfferForInternalParkingSpace } from './create-offer'

type ReplyToOfferError =
  | ReplyToOfferErrorCodes.NoOffer
  | ReplyToOfferErrorCodes.NoActiveOffer
  | ReplyToOfferErrorCodes.NoListing
  | ReplyToOfferErrorCodes.CreateLeaseFailure
  | ReplyToOfferErrorCodes.CloseOfferFailure
  | ReplyToOfferErrorCodes.Unknown

// PROCESS Part 3 - Accept Offer for Scored Parking Space
export const acceptOffer = async (
  offerId: number
): Promise<ProcessResult<null, ReplyToOfferError>> => {
  const log: string[] = [
    `Tacka ja till erbjudande om intern bilplats`,
    `Tidpunkt för ja tack: ${new Date()
      .toISOString()
      .substring(0, 16)
      .replace('T', ' ')}`,
    `Erbjudande-ID ${offerId}`,
  ]

  try {
    //Get offer
    const res = await leasingAdapter.getOfferByOfferId(offerId)
    if (!res.ok) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoOffer,
        404,
        `The offer ${offerId} does not exist or could not be retrieved.`
      )
    }

    const offer = res.data

    if (offer.status != OfferStatus.Active) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoActiveOffer,
        404,
        `The offer ${offerId} is not active.`
      )
    }

    log.push(
      `Sökande ${offer.offeredApplicant.contactCode} tackar ja till bilplats ${offer.rentalObjectCode}`
    )

    //Get listing
    const listing = await leasingAdapter.getListingByListingId(offer.listingId)

    if (!listing || !listing.districtCode) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoListing,
        404,
        `The listing ${offer.listingId.toString()} does not exist or is no longer available.`
      )
    }

    //Create lease
    let lease: any
    try {
      lease = await leasingAdapter.createLease(
        listing.rentalObjectCode,
        offer.offeredApplicant.contactCode,
        listing.vacantFrom != undefined
          ? new Date(listing.vacantFrom).toISOString() // fix: vacantFrom is really a string...
          : new Date().toISOString(),
        '001'
      )

      log.push(`Kontrakt skapat: ${lease.LeaseId}`)
      log.push(
        'Kontrollera om moms ska läggas på kontraktet. Detta måste göras manuellt innan det skickas för påskrift.'
      )
    } catch (err) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.CreateLeaseFailure,
        500,
        `Create Lease for ${offerId} failed.`,
        err
      )
    }

    //Reset waiting list
    const waitingListResult = await leasingAdapter.resetWaitingList(
      offer.offeredApplicant.nationalRegistrationNumber,
      offer.offeredApplicant.contactCode,
      WaitingListType.ParkingSpace
    )
    if (!waitingListResult.ok) {
      log.push(
        'Kunde inte återställa köpoäng för bilplatser: ' + waitingListResult.err
      )
      logger.error(waitingListResult.err)
    }

    //Deny other offers for this contact
    const otherOffers = await getContactOtherActiveOffers({
      contactCode: offer.offeredApplicant.contactCode,
      excludeOfferId: offer.id,
    })
    if (!otherOffers.ok) {
      log.push(
        `Andra erbjudanden för ${offer.offeredApplicant.contactCode} kunde inte hämtas så det går inte att tacka nej.`
      )
      logger.error(otherOffers.err)
    } else {
      const denyOtherOffers = await Promise.all(
        otherOffers.data.map((o) => denyOffer(o.id))
      )
      const failedDenyOtherOffers = denyOtherOffers.filter(
        (o) => o.processStatus === ProcessStatus.failed
      )
      if (failedDenyOtherOffers.length > 0) {
        log.push(
          'Kunde inte neka följande andra erbjudanden för kunden: ' +
            failedDenyOtherOffers.join(', ')
        )
      }
    }

    //Close offer
    const closeOffer = await leasingAdapter.closeOfferByAccept(offer.id)
    if (!closeOffer.ok) {
      log.push(`Something went wrong when closing the offer ${offer.id}.`)
      logger.error(closeOffer.err)
    }

    const closeListing = await leasingAdapter.updateListingStatus(
      listing.id,
      ListingStatus.Closed
    )

    if (!closeListing.ok) {
      log.push(`Something went wrong when closing the listing ${listing.id}.`)
      logger.error(closeListing.err)
    }

    try {
      //send notification to the leasing team with the log with any failures
      await communicationAdapter.sendNotificationToRole(
        'leasing',
        'Bilplats tilldelad och kontrakt skapat för intern bilplats',
        log.join('\n')
      )
    } catch (error) {
      log.push('Send Notification to leasing failed')
      logger.error(error, 'Send Notification to leasing failed')
    }

    logger.debug(log)
    communicationAdapter.sendNotificationToRole(
      'dev',
      `Accept offer - summary`,
      log.join('\n')
    )

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 202,
      data: null,
    }
  } catch (err) {
    return endFailingProcess(
      log,
      ReplyToOfferErrorCodes.Unknown,
      500,
      `Accept offer of parking space uncaught error`,
      err
    )
  }
}

// PROCESS Part 3 - Deny Offer for Scored Parking Space
export const denyOffer = async (
  offerId: number
): Promise<ProcessResult<{ listingId: number }, ReplyToOfferError>> => {
  const log: string[] = [
    `Tacka nej till erbjudande om intern bilplats`,
    `Tidpunkt för nej tack: ${new Date()
      .toISOString()
      .substring(0, 16)
      .replace('T', ' ')}`,
    `Erbjudande-ID ${offerId}`,
  ]

  try {
    //Get offer
    const res = await leasingAdapter.getOfferByOfferId(offerId)
    if (!res.ok) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoOffer,
        404,
        `The offer ${offerId} does not exist or could not be retrieved.`
      )
    }
    const offer = res.data

    //Get listing
    const listing = await leasingAdapter.getListingByListingId(offer.listingId)
    if (!listing || !listing.districtCode) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoListing,
        404,
        `The listing ${offer.listingId.toString()} does not exist or is no longer available.`
      )
    }

    const closeOffer = await leasingAdapter.closeOfferByDeny(offer.id)

    if (!closeOffer.ok) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.CloseOfferFailure,
        500,
        `Something went wrong when denying the offer ${offer.id}`
      )
    }

    log.push('Creating new offer for this listing...')
    const createOffer = await createOfferForInternalParkingSpace(
      offer.listingId
    )

    if (createOffer.processStatus === ProcessStatus.failed) {
      logger.info(createOffer, 'Could not create new offer for this listing.')
      log.push(
        `Could not create new offer for this listing: ${createOffer.error}`
      )
    }

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 202,
      data: { listingId: listing.id },
    }
  } catch (err) {
    return endFailingProcess(
      log,
      ReplyToOfferErrorCodes.Unknown,
      500,
      `Deny offer for internal parking space - unknown error`,
      err
    )
  }
}

// PROCESS Part 3 - Expire Offer for Scored Parking Space
export const expireOffer = async (
  offerId: number
): Promise<ProcessResult<null, ReplyToOfferError>> => {
  const log: string[] = [
    `Svarstide har gått ut för erbjudande om intern bilplats`,
    `Tidpunkt för när svarstiden gått ut: ${new Date()
      .toISOString()
      .substring(0, 16)
      .replace('T', ' ')}`,
    `Erbjudande-ID ${offerId}`,
  ]

  try {
    //Get offer
    const res = await leasingAdapter.getOfferByOfferId(offerId)
    if (!res.ok) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoOffer,
        404,
        `The offer ${offerId} does not exist or could not be retrieved.`
      )
    }
    const offer = res.data

    //Get listing
    const listing = await leasingAdapter.getListingByListingId(offer.listingId)
    if (!listing || !listing.districtCode) {
      return endFailingProcess(
        log,
        ReplyToOfferErrorCodes.NoListing,
        404,
        `The listing ${offer.listingId.toString()} does not exist or is no longer available.`
      )
    }

    return {
      processStatus: ProcessStatus.successful,
      httpStatus: 200,
      data: null,
    }
  } catch (err) {
    return endFailingProcess(
      log,
      ReplyToOfferErrorCodes.Unknown,
      404,
      `Expire offer for internal parking space - unknown error`,
      err
    )
  }
}

const getContactOtherActiveOffers = async (params: {
  contactCode: string
  excludeOfferId: number
}): Promise<AdapterResult<Array<OfferWithRentalObjectCode>, 'unknown'>> => {
  const res = await leasingAdapter.getOffersForContact(params.contactCode)
  if (!res.ok) {
    if (res.err === 'not-found') {
      return { ok: true, data: [] }
    }
    return { ok: false, err: 'unknown' }
  }

  return {
    ok: true,
    data: res.data
      .filter((o) => o.status === OfferStatus.Active)
      .filter((o) => o.id !== params.excludeOfferId),
  }
}

// Ends a process gracefully by debugging log, logging the error, sending the error to the dev team and return a process error with the error code and details
const endFailingProcess = (
  log: any[],
  processErrorCode: string,
  httpStatus: number,
  details: string,
  error?: any
): ProcessError => {
  log.push(details)
  if (error) log.push(error)

  logger.debug(log)
  logger.error(error ?? processErrorCode, details)

  communicationAdapter.sendNotificationToRole(
    'dev',
    `Reply to Offer - ${processErrorCode}`,
    log.join('\n')
  )

  return makeProcessError(processErrorCode, httpStatus, { message: details })
}
