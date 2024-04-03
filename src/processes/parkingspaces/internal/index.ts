import { getPublishedParkingSpace } from '../../../adapters/property-management-adapter'
import { ProcessResult, ProcessStatus } from '../../../common/types'
import {
  addApplicantToWaitingList,
  applyForListing,
  createNewListing,
  getContact,
  getLeasesForPnr,
  getListingByRentalObjectCode,
  getWaitingList,
} from '../../../adapters/leasing-adapter'
import {
  Applicant,
  ListingStatus,
  ParkingSpaceApplicationCategory,
  parkingSpaceApplicationCategoryTranslation,
} from 'onecore-types'
import axios, { AxiosError, HttpStatusCode } from 'axios'
import * as http from 'http'

//
// PROCESS part 1 (Create note of interest for internal parking space)
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

//todo: fix all tests to also include applicationType
export const createNoteOfInterestForInternalParkingSpace = async (
  parkingSpaceId: string,
  contactCode: string, //todo: rename to contactCode
  applicationType: string
): Promise<ProcessResult> => {
  const log: string[] = [
    `Ansökan om intern bilplats`,
    `Tidpunkt för ansökan: ${new Date()
      .toISOString()
      .substring(0, 16)
      .replace('T', ' ')}`,
    `Sökande ${contactCode} har ansökt om bilplats ${parkingSpaceId}`,
  ]

  try {
    const listing = await getPublishedParkingSpace(parkingSpaceId)
    // step 1 - get parking space
    if (!listing) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 404,
        response: {
          message: `The parking space ${parkingSpaceId} does not exist or is no longer available.`,
        },
      }
    }

    if (
      listing.applicationCategory != ParkingSpaceApplicationCategory.internal
    ) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 400,
        response: {
          message: `This process currently only handles internal parking spaces. The parking space provided is not internal (it is ${listing.applicationCategory}, ${parkingSpaceApplicationCategoryTranslation.internal}).`,
        },
      }
    }

    // Step 2. Get information about applicant and contracts
    const applicantContact = await getContact(contactCode)
    if (!applicantContact) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 404,
        response: {
          message: `Applicant ${contactCode} could not be retrieved.`,
        },
      }
    }
    //step 3a. Check if applicant is tenant
    const leases = await getLeasesForPnr(
      applicantContact.nationalRegistrationNumber
    )
    if (leases.length < 1) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 403,
        response: {
          message: 'Applicant is not a tenant',
        },
      }
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
    console.log(log) //log output up to this point for historic reasons and for test cases

    //step 4.b Add parking space listing to onecore-leases database
    //todo: decide on which way forward:
    //todo: 1. do check in core if listing exists
    //todo: 2  do check in leasing POST endpoint if listing exists
    //todo: if 1, the error code below could be removed
    const existingListing = await getListingByRentalObjectCode(parkingSpaceId)

    if (existingListing == undefined) {
      try {
        const createListingResult = await createNewListing(listing)
        if (createListingResult.status == HttpStatusCode.Created) {
          //todo: add log entry for successful create
          console.log(createListingResult)
        }
      } catch (error) {
        //check if the listing already exists
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError

          if (axiosError.response?.status === HttpStatusCode.Conflict) {
            log.push(
              `Annons existerar sedan tidigare i onecore-leasing, fortsätter med att skapa ansökan`
            )
          } else {
            return {
              processStatus: ProcessStatus.failed,
              httpStatus: 500,
              response: {
                message: error.message,
              },
            }
          }
        }
        return {
          processStatus: ProcessStatus.failed,
          httpStatus: 500,
          response: {
            message: error,
          },
        }
      }
    }

    console.log(log)

    //step 4.c Add applicant to onecore-leasing database
    if (existingListing != undefined) {
      const applicant: Applicant = {
        id: 0, //should not be passed
        name: applicantContact.fullName,
        contactCode: applicantContact.contactCode,
        applicationDate: new Date(),
        applicationType: applicationType,
        status: ListingStatus.Active,
        listingId: existingListing?.id,
      }

      const applyForListingResult = await applyForListing(applicant)
      console.log('applyForListingResult', applyForListingResult)

      if (
        applyForListingResult != undefined &&
        applyForListingResult.status == HttpStatusCode.Created
      ) {
        //todo: better log message?
        log.push(`Sökande placerad i kö. Process avslutad`)

        return {
          processStatus: ProcessStatus.successful,
          httpStatus: 200,
          response: {
            message: `Applicant ${contactCode} placed in listing for parking space ${parkingSpaceId}`,
          },
        }
      }

      //todo: add error clauses
    }
    console.log(log)

    return {
      processStatus: ProcessStatus.failed,
      httpStatus: 500,
      response: {
        message: 'failed due to unknown error',
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

//
// PROCESS part 2 (Scheduled job removes ad on due date/time, applicants sorted, create contract, publish as external if not applicants )
//
// 1. Scheduled job checks for due date of ad. The ad is "unpublished" on due date, E.G. not possible to apply anymore.
// 2. The list of applicants is sorted on queue time and other business rules.
// 3. Offer flow for the "best" suited applicant is triggered
// 4. Applicant is notified by mail that they have an offer to accept
// 5. If applicant accepts offer, contract is created and sent via email. the other applicants are notified that the parking space has been rented.
// 6. If offer is declined, the user is removed from list of applicants, process starts over from step 6
// 7. If no applicants are found, the ad is published as an external parking space
export const createLeaseForInternalParkingSpace =
  async (): Promise<ProcessResult> => {
    return {
      processStatus: ProcessStatus.inProgress,
      httpStatus: 500,
      response: {
        message: 'todo',
      },
    }
  }
