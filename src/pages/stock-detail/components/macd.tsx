import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMACD } from '../hooks/useMACD'
import { useTimeframe } from '../hooks/useTimeframe'
import { format } from 'date-fns'
import { technicalChartConfig } from '../constants'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts'

function MACDSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>MACD</span>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
        <Skeleton className="mt-1 h-4 w-3/4" />
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

export function MACD({ symbol }: { symbol: string | undefined }) {
  const timeframe = useTimeframe()

  const { data: macdData, isLoading: isLoadingMACD } = useMACD({
    symbol,
    timeframe,
  })

  if (isLoadingMACD) {
    return <MACDSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>MACD</span>
          <span className="text-sm font-normal text-muted-foreground">
            Momentum Indicator
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Black line crossing above red = bullish signal. Bars show momentum
          strength.
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={technicalChartConfig}>
          <ComposedChart data={macdData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(tick) =>
                typeof tick === 'number'
                  ? format(new Date(tick), 'HH:mm:ss')
                  : '---'
              }
            />
            <YAxis />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar
              dataKey="histogram"
              stroke="none"
              opacity={0.6}
              fill="hsl(var(--accent))"
            >
              {macdData?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.histogram >= 0
                      ? 'hsl(142.1 76.2% 36.3%)'
                      : 'hsl(346.8 77.2% 49.8%)'
                  }
                />
              ))}
            </Bar>

            <Line
              type="monotone"
              dataKey="value"
              name="MACD"
              stroke="hsl(var(--primary))"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="signal"
              name="Signal"
              stroke="hsl(var(--destructive))"
              dot={false}
              strokeWidth={2}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
