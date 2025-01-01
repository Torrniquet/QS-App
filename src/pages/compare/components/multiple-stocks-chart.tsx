import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ChartDataPoint } from '@/lib/schemas'
import { getTimeFormatter, Timeframe } from '@/lib/timeframe'
import { useMemo } from 'react'
import { CHART_COLORS } from '../constants'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

// This creates the chart config dynamically
// Will end up like:
// {
//   "AAPL": { label: "AAPL", color: "hsl(var(--color-aapl))" },
//   "GOOGL": { label: "GOOGL", color: "hsl(var(--color-googl))" },
//   ...
// }
function createChartConfig(symbols: string[]) {
  return symbols.reduce((config, symbol, index) => {
    if (index >= CHART_COLORS.length) return config // Safety check to not exceed our colors

    config[symbol] = {
      label: symbol,
      color: `hsl(var(${CHART_COLORS[index]}))`, // Using shadcn's HSL format
    }
    return config
  }, {} as ChartConfig)
}

export function MultipleStocksChart({
  data,
  timeframe,
  isError,
}: {
  data: Record<string, ChartDataPoint[]>
  timeframe: Timeframe
  isError: boolean
}) {
  // Combine all data points preserving the timestamp
  const combinedData = useMemo(() => {
    // Get all unique timestamps
    const timestamps = new Set(
      Object.values(data).flatMap((points) => points.map((p) => p.t))
    )

    // Create combined data points
    return Array.from(timestamps)
      .map((timestamp) => {
        const point = { t: timestamp } as Record<string, number>
        // Add each symbol's closing price for this timestamp
        Object.entries(data).forEach(([symbol, points]) => {
          const matchingPoint = points.find((p) => p.t === timestamp)
          point[symbol] = matchingPoint?.c ?? 0
        })
        return point
      })
      .sort((a, b) => a.t - b.t)
  }, [data])

  const chartConfig = createChartConfig(Object.keys(data))

  return (
    <div className="h-[400px]">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart data={combinedData}>
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
                hideLabel
                valueFormatter={(value) => `$${value.toLocaleString()}`}
              />
            }
          />
          {Object.keys(data).map((symbol) => (
            <Line
              key={symbol}
              type="monotone"
              dataKey={symbol}
              stroke={`var(--color-${symbol})`}
              dot={false}
              name={symbol}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
