import * as utils from '.'

describe(utils.date.addBusinessDays, () => {
  it('given friday, adding two days gives tuesday', () => {
    const d = new Date('2022-11-11') // Friday

    const expected = new Date('2022-11-15')
    const result = utils.date.addBusinessDays(d, 2)
    expect(result.toISOString()).toEqual(expected.toISOString())
  })

  it('given monday, adding five days gives monday', () => {
    const d = new Date('2022-11-07') // Monday

    const expected = new Date('2022-11-14')
    const result = utils.date.addBusinessDays(d, 5)
    expect(result.toISOString()).toEqual(expected.toISOString())
  })

  it('given monday, adding 20 days gives monday', () => {
    const d = new Date('2022-11-07') // Monday

    const expected = new Date('2022-12-05')
    const result = utils.date.addBusinessDays(d, 20)
    expect(result.toISOString()).toEqual(expected.toISOString())
  })

  it('respects holidays', () => {
    const d = new Date('2022-11-11') // Friday
    const holiday = new Date('2022-11-14') // Monday

    const expected = new Date('2022-11-16')
    const result = utils.date.addBusinessDays(d, 2, [holiday])
    expect(result.toISOString()).toEqual(expected.toISOString())
  })
})
