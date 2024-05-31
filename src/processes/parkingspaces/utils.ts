import { ProcessError, ProcessStatus } from '../../common/types'

export const makeProcessError = <E = any>(
  reason: E,
  httpStatus: number,
  response?: any
): ProcessError<E> => ({
  processStatus: ProcessStatus.failed,
  reason,
  httpStatus,
  response,
})
