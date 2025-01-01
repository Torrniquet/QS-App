import { ChartConfig } from '@/components/ui/chart'

export const priceChartConfig = {
  c: {
    // matches the data key from realtimeData
    label: 'Price',
    color: 'hsl(var(--chart-1))',
  },
  v: {
    // matches volume data key
    label: 'Volume',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export const technicalChartConfig = {
  value: {
    // matches RSI/SMA data key
    label: 'Value',
    color: 'hsl(var(--chart-3))',
  },
  signal: {
    // matches MACD signal
    label: 'Signal',
    color: 'hsl(var(--chart-4))',
  },
  histogram: {
    // matches MACD histogram
    label: 'Histogram',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

export const THROTTLE_TIME_FOR_REAL_TIME_DATA = 300
