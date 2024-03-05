import {
  sendNotificationToContact,
  sendNotificationToRole,
} from '../../../adapters/communication-adapter'
import { getParkingSpace } from '../../../adapters/property-management-adapter'
import { ProcessResult, ProcessStatus } from '../../../common/types'
import {
  createLease,
  getContact,
  getCreditInformation,
} from '../../../adapters/leasing-adapter'
import {
  ParkingSpaceApplicationCategory,
  parkingSpaceApplicationCategoryTranslation,
} from 'onecore-types'

//
// PROCESS (Create note of interest and contract for internal parking space)
//
// Description: Applicant adds note of interest to parking space marked as internal, automatic check is performed at due date/time of ad, contract is created in Xpand when "most" fitting applicant accepts offer
// Steps:
// 1.  Get parking space from mimer.nu API via onecore-property-management
// 2.  Get applicant from onecore-leasing
// 3.  Check that applicant is a tenant (note: is this safeguard needed?)
// 4.a Pass parking space ad and applicant data to onecore-leasing for further processing. onoecore-leasing has tables for keeping track of ads and applicants.
// 4.b onecore-leasing adds the parking space to internal db if not already existing.
// 4.c onecore-leasing adds applicants to the list of applicants for this particular ad
//
//note: the belows steps are probably handled in another function since they are triggered by the scheduled job
//
// 5.  Scheduled job checks for due date of ad. The ad is "unpublished" on due date, E.G. not possible to apply anymore.
// 6.  The list of applicants is sorted on queue time and other business rules.
// 7.  Offer flow for the "best" suited applicant is triggered
// 8.  Applicant is notified by mail that they have an offer to accept
// 9.  If applicant accepts offer, contract is created and sent via email. the other applicants are notified that the parking space has been rented.
// 10. If offer is declined, the user is removed from list of applicants, process starts over from step 6

//data model questions and thoughs:
export const createLeaseForInternalParkingSpace = async (
  parkingSpaceId: string,
  contactId: string
): Promise<ProcessResult> => {
  const log: string[] = [
    `Ansökan om intern bilplats`,
    `Tidpunkt för ansökan: ${new Date()
      .toISOString()
      .substring(0, 16)
      .replace('T', ' ')}`,
    `Sökande ${contactId} har ansökt om bilplats ${parkingSpaceId}`,
  ]

  try {
    const parkingSpace = await getParkingSpace(parkingSpaceId)

    // step 1 - get parking space
    if (!parkingSpace) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 404,
        response: {
          message: `The parking space ${parkingSpaceId} does not exist or is no longer available.`,
        },
      }
    }
    console.log("parking space: ", parkingSpace.applicationCategory, ParkingSpaceApplicationCategory.internal )

    if (
      parkingSpace.applicationCategory !=
      ParkingSpaceApplicationCategory.internal
    ) {
      console.log("failing")
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 400,
        response: {
          message: `This process currently only handles internal parking spaces. The parking space provided is not internal (it is ${parkingSpace.applicationCategory}, ${parkingSpaceApplicationCategoryTranslation.internal}).`,
        },
      }
    }

    // Step 2. Get information about applicant and contracts
    const applicantContact = await getContact(contactId)

    if (!applicantContact) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 404,
        response: {
          message: `Applicant ${contactId} could not be retrieved.`,
        },
      }
    }

    //todo: check if applicant is tenant to safeguard?

    return {
      processStatus: ProcessStatus.inProgress,
      httpStatus: 500,
      response: {
        message: "todo",
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
