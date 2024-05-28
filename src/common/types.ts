export enum ProcessStatus {
  successful,
  failed,
  inProgress,
}

export interface ProcessResult<T = string> {
  response?: any
  processStatus: ProcessStatus
  reason?: T
  httpStatus: number
}

export interface ProcessSuccess<T = any> {
  status: 'success'
  data: T
  httpStatus: number
}

export interface ProcessError<E = any> {
  status: 'error'
  reason: E
  httpStatus: number
}

export type ProcessResult2<T, E> = ProcessSuccess<T> | ProcessError<E>
