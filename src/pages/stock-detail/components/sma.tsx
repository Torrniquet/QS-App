import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTimeframe } from '@/hooks/use-timeframe'
import { useSMA } from '../hooks/useSMA'
import { technicalChartConfig } from '../constants'
import { getTimeFormatter } from '@/lib/timeframe'

export function SMA({ symbol }: { symbol: string | undefined }) {
  const timeframe = useTimeframe()

  const { data, isLoading, isError } = useSMA({
    symbol,
    timeframe,
  })

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load SMA data</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMA</CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardTitle>SMA</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={technicalChartConfig}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              interval="preserveStartEnd"
              minTickGap={50}
              tickFormatter={getTimeFormatter(timeframe)}
            />
            <YAxis domain={['auto', 'auto']} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
