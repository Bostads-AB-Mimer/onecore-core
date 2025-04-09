import nock from 'nock'

import config from '../../common/config'
import * as propertyBaseAdapter from '../property-base-adapter'
import * as factory from '../../../test/factories'

describe(propertyBaseAdapter.getCompanies, () => {
  it('returns err if unexpected error', async () => {
    nock(config.propertyBaseService.url).get('/getCompanies').reply(500)

    const result = await propertyBaseAdapter.getCompanies()

    expect(result).toEqual({ ok: false, err: 'unknown' })
  })

  it('returns ok and list of companies if 200', async () => {
    const companyInfo = factory.company.build()
    const companyList = [companyInfo]
    nock(config.propertyBaseService.url)
      .get('/companies')
      .reply(200, { content: companyList })

    const result = await propertyBaseAdapter.getCompanies()

    expect(result).toEqual({ ok: true, data: companyList })
  })
})
