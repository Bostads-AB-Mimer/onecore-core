import dayjs from 'dayjs'

export function addBusinessDays(
  date: Date,
  days: number,
  holidays: Array<Date> = []
) {
  const holidaySet = new Set(
    holidays.map((holiday) => dayjs(holiday).format('YYYY-MM-DD'))
  )

  const [d] = Array.from({
    length: days + Math.floor(days / 5) * 2 + holidays.length + 2,
  })
    .map((_, i) => dayjs(date).add(i + 1, 'day'))
    .filter((d) => d.day() % 6 && !holidaySet.has(d.format('YYYY-MM-DD')))
    .slice(0, days)
    .reverse()

  return d.toDate()
}
