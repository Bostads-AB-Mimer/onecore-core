import { HttpStatusCode } from 'axios'
import {
  parkingSpaceApplicationCategoryTranslation,
  ParkingSpaceApplicationCategory,
  Applicant,
  ApplicantStatus,
  Contact,
  Listing,
} from 'onecore-types'
import { logger } from 'onecore-utilities'

import {
  getContact,
  getLeasesForPnr,
  getWaitingList,
  addApplicantToWaitingList,
  getListingByRentalObjectCode,
  createNewListing,
  applyForListing,
  getInternalCreditInformation,
  setApplicantStatusActive,
  getApplicantByContactCodeAndListingId,
  validateResidentialAreaRentalRules,
  validatePropertyRentalRules,
} from '../../../adapters/leasing-adapter'
import { getPublishedParkingSpace } from '../../../adapters/property-management-adapter'
import { ProcessResult, ProcessStatus } from '../../../common/types'
import { makeProcessError, validateRentalRules } from '../utils'

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
  applicationType: 'Replace' | 'Additional'
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
    if (!parkingSpace || !parkingSpace.districtCode) {
      return {
        processStatus: ProcessStatus.failed,
        error: 'parkingspace-not-found',
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
    const getApplicantContact = await getContact(contactCode)
    if (!getApplicantContact.ok) {
      return makeProcessError('applicant-not-found', 404, {
        message: `Applicant ${contactCode} could not be retrieved.`,
      })
    }

    const applicantContact = getApplicantContact.data
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
    //Check if applicant is eligible for renting in area with specific rental rule
    const [validationResultResArea, validationResultProperty] =
      await Promise.all([
        validateResidentialAreaRentalRules(
          contactCode,
          parkingSpace.districtCode
        ),
        validatePropertyRentalRules(contactCode, parkingSpaceId),
      ]).then((results) =>
        results.map((res) => validateRentalRules(res, applicationType))
      )

    if (!validationResultResArea.ok) {
      return makeProcessError(validationResultResArea.err, 400)
    }
    if (!validationResultProperty.ok) {
      return makeProcessError(validationResultProperty.err, 400)
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

    const waitingListStatus = evaluateWaitingListStatus(waitingList)
    const shouldAddApplicantToWaitingList =
      waitingListStatus.shouldAddApplicantToWaitingList
    const isInWaitingListForInternalParking =
      waitingListStatus.isInWaitingListForInternalParking
    const isInWaitingListForExternalParking =
      waitingListStatus.isInWaitingListForExternalParking

    //xpand handles internal and external waiting list synonymously
    //a user should therefore always be placed in both waiting list
    if (shouldAddApplicantToWaitingList) {
      await handleWaitingList(
        isInWaitingListForInternalParking,
        'intern',
        applicantContact,
        log
      )

      await handleWaitingList(
        isInWaitingListForExternalParking,
        'extern',
        applicantContact,
        log
      )
    }

    log.push(
      `Validering genomförd. Sökande godkänd för att anmäla intresse på bilplats ${parkingSpaceId}`
    )

    //step 4.b Add parking space listing to onecore-leases database
    //todo: refactor get and create listing to new func ->
    //todo: should return the listing regardless of if it exists previously or is being created
    let listingAdapterResult =
      await getListingByRentalObjectCode(parkingSpaceId)
    if (listingAdapterResult?.ok) {
      log.push(
        `Annons med id ${listingAdapterResult.data?.id} existerar sedan tidigare i onecore-leasing`
      )
    }

    if (!listingAdapterResult.ok && listingAdapterResult?.err == 'not-found') {
      log.push(`Annons existerar inte i onecore-leasing, skapar annons`)
      const createListingResult = await createNewListing(parkingSpace)
      if (createListingResult.ok) {
        log.push(`Annons skapad i onecore-leasing`)
        listingAdapterResult = createListingResult
      }
    }

    //step 4.c Add applicant to onecore-leasing database
    //todo: fix schema for listingId in leasing, null should not be allowed
    //todo: or add a request type with only required fields
    if (listingAdapterResult.ok && listingAdapterResult?.data != undefined) {
      const applicantResponse = await getApplicantByContactCodeAndListingId(
        contactCode,
        listingAdapterResult.data.id.toString()
      )

      //create new applicant if applicant does not exist
      if (applicantResponse.status == HttpStatusCode.NotFound) {
        const applicantRequestBody = createApplicantRequestBody(
          applicantContact,
          applicationType,
          listingAdapterResult.data
        )

        log.push(`Sökande existerar inte, skapar sökande.`)

        const applyForListingResult =
          await applyForListing(applicantRequestBody)
        if (applyForListingResult.ok) {
          log.push(`Sökande skapad i onecore-leasing. Process avslutad.`)
          logger.debug(log)
          return {
            processStatus: ProcessStatus.successful,
            data: null,
            httpStatus: 200,
            response: {
              message: `Applicant ${contactCode} successfully applied to parking space ${parkingSpaceId}`,
            },
          }
        }

        if (applyForListingResult.err == 'conflict') {
          log.push(
            `Sökande existerar redan i onecore-leasing. Process avslutad`
          )
          logger.debug(log)
          return {
            processStatus: ProcessStatus.successful,
            data: null,
            httpStatus: 200,
            response: {
              message: `Applicant ${contactCode} already has application for ${parkingSpaceId}`,
            },
          }
        }
      }

      //if applicant has previously applied and withdrawn application, allow for subsequent application
      else if (applicantResponse.data.content) {
        const applicantStatus = applicantResponse.data.content.status
        const activeApplication = applicantStatus == ApplicantStatus.Active
        const applicationWithDrawnByUser =
          applicantStatus == ApplicantStatus.WithdrawnByUser
        const applicationWithDrawnByManager =
          applicantStatus == ApplicantStatus.WithdrawnByManager

        if (activeApplication) {
          log.push(
            `Sökande har redan en aktiv ansökan på bilplats ${parkingSpaceId}.`
          )
          return {
            processStatus: ProcessStatus.successful,
            data: null,
            httpStatus: 200,
            response: {
              message: `Applicant ${contactCode} already has application for ${parkingSpaceId}`,
            },
          }
        }

        if (applicationWithDrawnByUser || applicationWithDrawnByManager) {
          log.push(
            `Sökande har tidigare ansökt bilplats ${parkingSpaceId} men återkallat sin ansökan. Skapar ny ansökan.`
          )

          await setApplicantStatusActive(
            applicantResponse.data.content.id,
            applicantResponse.data.content.contactCode
          )

          logger.debug(log)
          return {
            processStatus: ProcessStatus.successful,
            data: null,
            httpStatus: 200,
            response: {
              message: `Applicant ${contactCode} successfully applied to parking space ${parkingSpaceId}`,
            },
          }
        }
      }
    }

    logger.error(
      listingAdapterResult,
      'Create not of interest for internal parking space failed due to unknown error'
    )
    return makeProcessError('internal-error', 500, {
      message: 'failed due to unknown error',
    })
  } catch (error: any) {
    logger.error(
      error,
      'Create not of interest for internal parking space failed'
    )
    return makeProcessError('internal-error', 500, {
      message: error.message,
    })
  }
}

const createApplicantRequestBody = (
  applicantContact: Contact,
  applicationType: string,
  listing: Listing
) => {
  const applicantRequestBody: Applicant = {
    id: 0, //should not be passed
    name: applicantContact.fullName,
    nationalRegistrationNumber: applicantContact.nationalRegistrationNumber,
    contactCode: applicantContact.contactCode,
    applicationDate: new Date(),
    applicationType: applicationType,
    status: ApplicantStatus.Active,
    listingId: listing.id, //null should not be allowed
  }
  return applicantRequestBody
}

const evaluateWaitingListStatus = (waitingList: any) => {
  let shouldAddApplicantToWaitingList = false
  let isInWaitingListForInternalParking = false
  let isInWaitingListForExternalParking = false

  if (waitingList.length > 0) {
    isInWaitingListForInternalParking = waitingList.some(
      (o: any) => o.waitingListTypeCaption === 'Bilplats (intern)'
    )
    isInWaitingListForExternalParking = waitingList.some(
      (o: any) => o.waitingListTypeCaption === 'Bilplats (extern)'
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

  return {
    shouldAddApplicantToWaitingList,
    isInWaitingListForInternalParking,
    isInWaitingListForExternalParking,
  }
}
const handleWaitingList = async (
  isInWaitingList: boolean,
  parkingType: string,
  applicantContact: Contact,
  log: any[]
) => {
  if (!isInWaitingList) {
    log.push(`Sökande saknas i kö för ${parkingType} parkeringsplats.`)
    const result = await addApplicantToWaitingList(
      applicantContact.nationalRegistrationNumber,
      applicantContact.contactCode,
      `Bilplats (${parkingType})`
    )
    if (result.status == HttpStatusCode.Created) {
      log.push(`Sökande placerad i kö för ${parkingType} parkeringsplats`)
    } else {
      logger.error(
        result,
        `Could not add applicant to ${parkingType} waiting list`
      )
      throw Error(result.statusText)
    }
  }
}
