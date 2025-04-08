import { loggedAxios as axios, logger } from 'onecore-utilities'
import { AxiosError } from 'axios'

import { Company } from 'onecore-types'

import config from '../common/config'

const propertyBaseService = config.propertyBaseService.url

const getCompanies = async (): Promise<{
  ok: boolean
  data?: Company[]
  err?: string
}> => {
  try {
    const result = await axios.get(`${propertyBaseService}/companies`)
    if (result.status === 200) {
      return {
        ok: true,
        data: result.data.content,
      }
    }

    return { ok: false, err: 'unknown' }
  } catch (err) {
    logger.error(err, 'Error getting companies from property base')
    if (err instanceof AxiosError && err.status === 404) {
      return {
        ok: false,
        err: 'not-found',
      }
    }

    return { ok: false, err: 'unknown' }
  }
}

export { getCompanies }
