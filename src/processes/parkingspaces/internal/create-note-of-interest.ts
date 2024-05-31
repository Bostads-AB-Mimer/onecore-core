import { HttpStatusCode } from 'axios'
import {
  parkingSpaceApplicationCategoryTranslation,
  ParkingSpaceApplicationCategory,
  Applicant,
  ApplicantStatus,
} from 'onecore-types'
import {
  getContact,
  getLeasesForPnr,
  getWaitingList,
  addApplicantToWaitingList,
  getListingByRentalObjectCode,
  createNewListing,
  applyForListing,
  getInternalCreditInformation,
} from '../../../adapters/leasing-adapter'
import { getPublishedParkingSpace } from '../../../adapters/property-management-adapter'
import { ProcessResult, ProcessStatus } from '../../../common/types'
import { makeProcessError } from '../utils'

// PROCESS Part 1 - Create note of interest for internal parking space
//
// Description: Applicant adds note of interest to parking space marked as internal, automatic check is performed at due date/time of ad, contract is created in Xpand when "most" fitting applicant accepts offer
// Steps:
// 1.  Get parking space from SOAP-service or xpand database (best buck for bang approach to be investigated)
// 2.  Get applicant from onecore-leasing
// 3.a Check that applicant is a tenant
// 3.b Check if applicant is in queue for parking spaces, if not add to queue. Use SOAP-service
// 4.a Pass parking space ad and applicant data to onecore-leasing for further processing. onoecore-leasing has tables for keeping track of ads and applicants.
// 4.b onecore-leasing adds the parking space to internal db if not already existing.
// 4.c onecore-leasing adds applicants to the list of applicants for this particular ad

export const createNoteOfInterestForInternalParkingSpace = async (
  parkingSpaceId: string,
  contactCode: string,
  applicationType: string
): Promise<ProcessResult<any, any>> => {
  const log: string[] = [
    `Ansökan om intern bilplats`,
    `Tidpunkt för ansökan: ${new Date()
      .toISOString()
      .substring(0, 16)
      .replace('T', ' ')}`,
    `Sökande ${contactCode} har ansökt om bilplats ${parkingSpaceId}`,
  ]

  try {
    const parkingSpace = await getPublishedParkingSpace(parkingSpaceId)
    // step 1 - get parking space
    if (!parkingSpace) {
      return {
        processStatus: ProcessStatus.failed,
        reason: 'parkingspace-not-found',
        httpStatus: 404,
        response: {
          message: `The parking space ${parkingSpaceId} does not exist or is no longer available.`,
        },
      }
    }

    const parkingSpaceApplicationType = parkingSpace.waitingListType
      ? parkingSpaceApplicationCategoryTranslation[parkingSpace.waitingListType]
      : undefined

    if (
      parkingSpaceApplicationType != ParkingSpaceApplicationCategory.internal
    ) {
      return makeProcessError('parkingspace-not-internal', 400, {
        message: `This process currently only handles internal parking spaces. The parking space provided is not internal (it is ${parkingSpaceApplicationType}, ${parkingSpaceApplicationCategoryTranslation.internal}).`,
      })
    }

    // Step 2. Get information about applicant and contracts
    const applicantContact = await getContact(contactCode)
    if (!applicantContact) {
      return makeProcessError('applicant-not-found', 404, {
        message: `Applicant ${contactCode} could not be retrieved.`,
      })
    }

    //step 3a. Check if applicant is tenant
    const leases = await getLeasesForPnr(
      applicantContact.nationalRegistrationNumber,
      undefined,
      undefined
    )
    if (leases.length < 1) {
      return makeProcessError('applicant-not-tenant', 403, {
        message: 'Applicant is not a tenant',
      })
    }

    //step 3.a.1. Perform credit check
    const creditCheck = await getInternalCreditInformation(
      applicantContact.contactCode
    )

    log.push(
      `Intern kreditkontroll genomförd, resultat: ${
        creditCheck ? 'inga anmärkningar' : 'hyresfakturor hos inkasso'
      }`
    )

    if (!creditCheck) {
      log.push(
        `Ansökan kunde inte beviljas på grund av ouppfyllda kreditkrav (se ovan).`
      )

      return makeProcessError('application-rejected', 400, {
        reason: 'Internal check failed',
        message: 'The parking space lease application has been rejected',
      })
    }

    //step 3.b Check if applicant is in queue for parking spaces, if not add to queue
    const waitingList = await getWaitingList(
      applicantContact.nationalRegistrationNumber
    )

    let shouldAddApplicantToWaitingList = false
    let isInWaitingListForInternalParking = false
    let isInWaitingListForExternalParking = false
    if (waitingList.length > 0) {
      isInWaitingListForInternalParking = waitingList.some(
        (o) => o.waitingListTypeCaption === 'Bilplats (intern)'
      )
      isInWaitingListForExternalParking = waitingList.some(
        (o) => o.waitingListTypeCaption === 'Bilplats (extern)'
      )
      if (
        !isInWaitingListForInternalParking ||
        !isInWaitingListForExternalParking
      ) {
        shouldAddApplicantToWaitingList = true
      }
    } else {
      shouldAddApplicantToWaitingList = true
    }
    //xpand handles internal and external waiting list synonymously
    //a user should therefore always be placed in both waiting list
    if (shouldAddApplicantToWaitingList) {
      if (!isInWaitingListForInternalParking) {
        log.push(`Sökande saknas i kö för intern parkeringsplats.`)
        const result = await addApplicantToWaitingList(
          applicantContact.nationalRegistrationNumber,
          applicantContact.contactCode,
          'Bilplats (intern)'
        )
        if (result.status == HttpStatusCode.Created) {
          log.push(`Sökande placerad i kö för intern parkeringsplats`)
        } else {
          throw Error(result.statusText)
        }
      }
      if (!isInWaitingListForExternalParking) {
        log.push(`Sökande saknas i kö för extern parkeringsplats.`)
        const result = await addApplicantToWaitingList(
          applicantContact.nationalRegistrationNumber,
          applicantContact.contactCode,
          'Bilplats (extern)'
        )
        if (result.status == HttpStatusCode.Created) {
          log.push(`Sökande placerad i kö för extern parkeringsplats`)
        } else {
          throw Error(result.statusText)
        }
      }
    }

    log.push(
      `Validering genomförd. Sökande godkänd för att anmäla intresse på bilplats ${parkingSpaceId}`
    )

    //step 4.b Add parking space listing to onecore-leases database
    let listing = await getListingByRentalObjectCode(parkingSpaceId)
    if (listing?.status == HttpStatusCode.Ok) {
      log.push(
        `Annons med id ${listing?.data.id} existerar sedan tidigare i onecore-leasing`
      )
    }

    if (listing?.status == HttpStatusCode.NotFound) {
      log.push(`Annons existerar inte i onecore-leasing, skapar annons`)
      const createListingResult = await createNewListing(parkingSpace)
      if (createListingResult?.status == HttpStatusCode.Created) {
        log.push(`Annons skapad i onecore-leasing`)
        listing = createListingResult
      }
    }

    //step 4.c Add applicant to onecore-leasing database
    //todo: fix schema for listingId in leasing, null should not be allowed
    //todo: or add a request type with only required fields
    if (listing?.data != undefined) {
      const applicant: Applicant = {
        id: 0, //should not be passed
        name: applicantContact.fullName,
        nationalRegistrationNumber: applicantContact.nationalRegistrationNumber,
        contactCode: applicantContact.contactCode,
        applicationDate: new Date(),
        applicationType: applicationType,
        status: ApplicantStatus.Active,
        listingId: listing.data?.id, //null should not be allowed
      }

      const applyForListingResult = await applyForListing(applicant)

      if (applyForListingResult?.status == HttpStatusCode.Created) {
        log.push(`Sökande skapad i onecore-leasing. Process avslutad.`)
        console.log(log)
        return {
          processStatus: ProcessStatus.successful,
          data: null,
          httpStatus: 200,
          response: {
            message: `Applicant ${contactCode} successfully applied to parking space ${parkingSpaceId}`,
          },
        }
      }
      if (applyForListingResult?.status == HttpStatusCode.Conflict) {
        log.push(`Sökande existerar redan i onecore-leasing. Process avslutad`)
        console.log(log)
        return makeProcessError('applicant-already-exists', 200, {
          message: 'Applicant already exists in listing',
        })
      }
    }

    return makeProcessError('internal-error', 500, {
      message: 'failed due to unknown error',
    })
  } catch (error: any) {
    return makeProcessError('internal-error', 500, {
      message: error.message,
    })
  }
}
