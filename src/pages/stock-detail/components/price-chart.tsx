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
import { ConnectionState } from '@/lib/websocket'
import { cn } from '@/lib/utils'

const CONNECTION_STATE_LABEL_MAP: Record<ConnectionState, string> = {
  connected: 'Connected',
  authenticated: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
}

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

export function PriceChart({ symbol }: { symbol: string | undefined }) {
  const timeframe = useTimeframe()

  const {
    chartData,
    isInitialChartDataLoading,
    isChartDataError,
    chartConnectionState,
    isChartRealtime,
  } = useChartData({
    symbol,
    timeframe,
  })

  const queryClient = useQueryClient()

  const updateTimeframe = (timeframe: Timeframe) => {
    queryClient.setQueryData(TIMEFRAME_KEY, timeframe)
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

  if (isChartDataError) {
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
          <p className="text-sm text-destructive">Failed to load chart data</p>
        </CardContent>
      </Card>
    )
  }

  if (isInitialChartDataLoading || !chartData) {
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

  return (
    <Card className="w-full">
      <CardHeader
        className={cn('flex flex-row items-center', {
          'justify-between': isChartRealtime,
        })}
      >
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
        {isChartRealtime && (
          <div
            className="flex items-center gap-1.5 rounded-lg border p-2"
            // Needed to override card header inner styles
            style={{
              marginTop: 0,
            }}
          >
            <div
              className={cn('size-3 rounded-full', {
                'bg-green-500':
                  chartConnectionState === 'connected' ||
                  chartConnectionState === 'authenticated',
                'bg-yellow-500': chartConnectionState === 'connecting',
                'bg-red-500': chartConnectionState === 'disconnected',
              })}
            />
            <p className="text-xs font-bold">
              {CONNECTION_STATE_LABEL_MAP[chartConnectionState]}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Price line chart */}
        <div className="h-[400px]">
          <ChartContainer config={priceChartConfig} className="h-full w-full">
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

        {/* Volume bar chart */}
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
