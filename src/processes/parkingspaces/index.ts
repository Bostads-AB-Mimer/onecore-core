import {
  sendNotificationToContact,
  sendNotificationToRole,
} from '../../adapters/communications-adapter'
import { getParkingSpace } from '../../adapters/xpand-adapter'
import {
  ProcessResult,
  ProcessStatus,
  parkingSpaceApplicationCategoryTranslation,
} from '../../common/types'
import {
  createLease,
  getContact,
  getCreditInformation,
} from '../../services/lease-service/adapters/tenant-lease-adapter'

export const createLeaseForExternalParkingSpace = async (
  parkingSpaceId: string,
  contactId: string
): Promise<ProcessResult> => {
  const log: string[] = [
    `Ansökan om extern bilplats ${new Date().toISOString()}`,
    `Sökande ${contactId} ansöker om bilplats ${parkingSpaceId}`,
  ]

  try {
    // Step 1. Get parking space, choose process according to type (internal/external)
    const parkingSpace = await getParkingSpace(parkingSpaceId)

    if (!parkingSpace) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 404,
        response: {
          message: `The parking space ${parkingSpaceId} does not exist or is no longer available.`,
        },
      }
    }

    if (
      parkingSpace.applicationCategory !=
      parkingSpaceApplicationCategoryTranslation.external
    ) {
      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 400,
        response: {
          message: `This process currently only handles external parking spaces. The parking space provided is not external.`,
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

    let creditCheck = false

    if (
      !applicantContact.leaseIds ||
      applicantContact.leaseIds.length == 0 ||
      true // testing
    ) {
      // Step 3A. External credit check if applicant is not a tenant.
      if (process.env.NODE_ENV !== 'production') {
        //applicantContact.nationalRegistrationNumber = '198001045775'
        //applicantContact.nationalRegistrationNumber = '198001045775'
      }
      const creditInformation = await getCreditInformation(
        applicantContact.nationalRegistrationNumber
      )
      creditCheck = creditInformation.status === '1'
      console.log('creditInformation', creditInformation)
      log.push(
        `Extern kreditupplysning genomförd. Resultat: ${creditInformation.status_text} (${creditInformation.errorList?.[0].Reject_text})`
      )
    } else {
      // Step 3B. Internal credit check if applicant is a tenant
      creditCheck = true
      log.push(`Internal credit check performed, result: ${creditCheck}`)
    }

    console.log(parkingSpace, applicantContact)

    if (creditCheck) {
      // Step 4A. Create lease
      const lease = await createLease(
        parkingSpace.parkingSpaceId,
        applicantContact.contactCode,
        '2024-01-01',
        '001'
      )

      log.push(`Kontrakt skapat: ${lease.LeaseId}`)

      if (lease.vatIncluded) {
        log.push(
          'OBS: Moms ska läggas på kontraktet. Detta måste göras manuellt innan det skickas för påskrift.'
        )
      }

      console.log('lease', lease)
      // Step 5A. Notify of success

      await sendNotificationToContact(
        applicantContact,
        `Din ansökan om bilplats har godkänts. Du kommer inom kort att få ett kontrakt att skriva under digitalt. Kontraktet har nummer ${lease.LeaseId} om du behöver referera till det i kontakt med kundtjänst.`
      )
      await sendNotificationToRole('uthyrning', log.join('\n'))

      return {
        processStatus: ProcessStatus.successful,
        response: {
          lease,
          message: 'Parking space lease created.',
        },
        httpStatus: 200,
      }
    } else {
      // Step 5B. Notify of rejection

      log.push(
        `Ansökan kunde inte beviljas på grund av ouppfyllda kreditkrav (se ovan).`
      )

      await sendNotificationToContact(
        applicantContact,
        'Din ansökan om bilplats kunde tyvärr inte godkännas.'
      )
      await sendNotificationToRole('uthyrning', log.join('\n'))

      return {
        processStatus: ProcessStatus.failed,
        httpStatus: 200,
        response: {
          message: 'The parking space lease application has been rejected',
        },
      }
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
