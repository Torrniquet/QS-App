import { useChartData } from '../hooks/useChartData'
import { Skeleton } from '@/components/ui/skeleton'
import { useTimeframe } from '@/hooks/use-timeframe'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useQueryClient } from '@tanstack/react-query'
import { stockDetailKeys, TIMEFRAME_KEY } from '@/lib/queryKeys'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { getTimeFormatter, Timeframe, timeframeConfig } from '@/lib/timeframe'
import { priceChartConfig } from '../constants'
import { NUMBER_SCALES, NUMBER_SUFFIXES } from '@/lib/constants'
import { api } from '@/lib/api'

function formatVolume(value: number) {
  const { MILLION, THOUSAND } = NUMBER_SCALES
  const { MILLION: M, THOUSAND: K } = NUMBER_SUFFIXES

  if (value >= MILLION) {
    return `$${(value / MILLION).toFixed(2)}${M}`
  }
  if (value >= THOUSAND) {
    return `$${(value / THOUSAND).toFixed(2)}${K}`
  }
  return `$${value.toLocaleString()}`
}

function PriceChartSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-10 w-[300px]" /> {/* Tabs area */}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Price chart skeleton */}
          <div className="h-[400px]">
            <Skeleton className="h-full w-full" />
          </div>
          {/* Volume chart skeleton */}
          <div className="h-[200px]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PriceChart({ symbol }: { symbol: string | undefined }) {
  const timeframe = useTimeframe()

  const { chartData, isInitialChartDataLoading } = useChartData({
    symbol,
    timeframe,
  })

  const queryClient = useQueryClient()
  const updateTimeframe = (timeframe: Timeframe) => {
    queryClient.setQueryData(TIMEFRAME_KEY, timeframe)
  }

  if (isInitialChartDataLoading || !chartData) {
    return <PriceChartSkeleton />
  }

  function prefetchStockDetail() {
    if (!symbol) return

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.chart(symbol, timeframe),
      queryFn: () => api.getChartData(symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.technicals.macd(symbol, timeframe),
      queryFn: () => api.getMACDData(symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.technicals.sma(symbol, timeframe),
      queryFn: () => api.getSMAData(symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.technicals.rsi(symbol, timeframe),
      queryFn: () => api.getRSIData(symbol, timeframe),
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <Tabs
          value={timeframe}
          onValueChange={(value) => updateTimeframe(value as Timeframe)}
        >
          <TabsList>
            {Object.entries(timeframeConfig).map(([key, { label }]) => (
              <TabsTrigger
                key={key}
                value={key}
                onMouseEnter={prefetchStockDetail}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer
            config={priceChartConfig}
            className="h-[400px] w-full"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                minTickGap={25}
                tickFormatter={getTimeFormatter(timeframe)}
              />
              <YAxis domain={['auto', 'auto']} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    valueFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="c"
                stroke="var(--color-c)"
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="mt-6 h-[200px] w-full">
          <ChartContainer config={priceChartConfig} className="h-full w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                minTickGap={25}
                tickFormatter={getTimeFormatter(timeframe)}
              />
              <YAxis />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    valueFormatter={(value) =>
                      typeof value === 'number'
                        ? formatVolume(value)
                        : value.toLocaleString()
                    }
                  />
                }
              />
              <Bar dataKey="v" fill="var(--color-v)" opacity={0.5} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
