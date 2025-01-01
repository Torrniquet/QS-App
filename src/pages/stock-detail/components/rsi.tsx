import { useRSI } from '../hooks/use-rsi'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { useTimeframe } from '@/hooks/use-timeframe'
import { Skeleton } from '@/components/ui/skeleton'
import { technicalChartConfig } from '../constants'
import { getTimeFormatter } from '@/lib/timeframe'

const RSI_THRESHOLDS = {
  overbought: 70,
  oversold: 30,
}

export function RSI({ symbol }: { symbol: string | undefined }) {
  const timeframe = useTimeframe()

  const { data, isLoading, isError } = useRSI({
    symbol,
    timeframe,
  })

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RSI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load RSI data</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RSI</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chart area skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            {/* Axis ticks */}
            <div className="flex justify-between px-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RSI</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={technicalChartConfig}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={getTimeFormatter(timeframe)}
              interval="preserveStartEnd" // Show first and last tick always
              minTickGap={50} // Minimum pixel space between ticks to avoid too much density
            />
            <YAxis
              domain={[0, 100]}
              ticks={[
                0,
                RSI_THRESHOLDS.oversold,
                RSI_THRESHOLDS.overbought,
                100,
              ]}
            />
            <ReferenceLine
              y={RSI_THRESHOLDS.oversold}
              stroke="hsl(var(--destructive))"
            />
            <ReferenceLine
              y={RSI_THRESHOLDS.overbought}
              stroke="hsl(var(--destructive))"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              dot={false}
              strokeWidth={2}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
