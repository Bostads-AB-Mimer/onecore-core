import { ProcessResult, ProcessStatus } from '../../../common/types'

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
    // step 1 - get list of applicants
    // step 2 - sort applicants by rental criteria
    // step 3 - check for valid applicants
    // step 3a - create offer
    // step 4 - update status of winning applicant
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
