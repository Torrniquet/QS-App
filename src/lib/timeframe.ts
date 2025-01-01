import { format, startOfToday, subDays, subMonths, subYears } from 'date-fns'

export const timeframeConfig: Record<
  Timeframe,
  { label: string; interval: string }
> = {
  '1D': { label: 'Day (Live)', interval: 'second' },
  '1W': { label: '1 Week', interval: 'hour' },
  '1M': { label: '1 Month', interval: 'day' },
  '1Y': { label: '1 Year', interval: 'day' },
} as const

export const getTimeFormatter = (timeframe: Timeframe) => (tick: number) => {
  if (typeof tick !== 'number') return '---'

  switch (timeframe) {
    case '1D':
      return format(new Date(tick), 'HH:mm:ss')
    case '1W':
      return format(new Date(tick), 'MM-dd HH:mm')
    case '1M':
      return format(new Date(tick), 'MM-dd')
    case '1Y':
      return format(new Date(tick), 'yyyy-MM-dd')
    default:
      return format(new Date(tick), 'HH:mm:ss')
  }
}

export type Timeframe = '1D' | '1W' | '1M' | '1Y'

export function getTimeframeConfig(timeframe: Timeframe) {
  const configs = {
    '1D': {
      multiplier: 1,
      timespan: 'minute',
      from: format(startOfToday(), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    },
    '1W': {
      multiplier: 1,
      timespan: 'hour',
      from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    },
    '1M': {
      multiplier: 1,
      timespan: 'day',
      from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    },
    '1Y': {
      multiplier: 1,
      timespan: 'day',
      from: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    },
  } as const

  return configs[timeframe]
}
