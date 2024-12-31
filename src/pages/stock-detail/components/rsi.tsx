import { useRSI } from '../hooks/useRSI'
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
import { useTimeframe } from '../hooks/useTimeframe'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { technicalChartConfig } from '../constants'

function RSISkeleton() {
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

export function RSI({ symbol }: { symbol: string | undefined }) {
  const timeframe = useTimeframe()

  const { data: rsiData, isLoading: isLoadingRSI } = useRSI({
    symbol,
    timeframe,
  })

  if (isLoadingRSI) {
    return <RSISkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RSI</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={technicalChartConfig}>
          <LineChart data={rsiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(tick: number | string): string => {
                const timestamp = Number(tick)
                if (Number.isFinite(timestamp)) {
                  const formatted = format(new Date(timestamp), 'HH:mm:ss')
                  return String(formatted)
                }
                return '---'
              }}
            />
            <YAxis domain={[0, 100]} />
            <ReferenceLine y={30} stroke="hsl(var(--destructive))" />
            <ReferenceLine y={70} stroke="hsl(var(--destructive))" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              dot={false}
              strokeWidth={2}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
