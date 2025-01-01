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

type MultipleStocksChartProps = {
  data: Record<string, ChartDataPoint[]>
  timeframe: Timeframe
}

export function MultipleStocksChart({
  data,
  timeframe,
}: MultipleStocksChartProps) {
  const combinedData = useMemo(() => {
    // 1. Extract all timestamps from all stocks
    const allDataPoints = Object.values(data).flat()
    // t stands for timestamp
    const uniqueTimestamps = [
      ...new Set(allDataPoints.map((point) => point.t)),
    ].sort()

    // 2. Create a map of timestamps to prices for each stock
    const stockPricesByTime = Object.entries(data).reduce(
      (priceMap, [symbol, points]) => {
        // Create a quick lookup of timestamp -> closing price for this stock
        // c stands for closing price
        // it's what we're interested in when showing price on the chart
        const stockPrices = points.reduce(
          (prices, point) => {
            prices[point.t] = point.c
            return prices
          },
          {} as Record<number, number>
        )

        priceMap[symbol] = stockPrices
        return priceMap
      },
      {} as Record<string, Record<number, number>>
    )

    // 3. Combine into final data points
    // will end up like:
    // [
    //   { t: 1714857600, AAPL: 150.12, GOOGL: 2800.15, ... },
    //   { t: 1714857660, AAPL: 150.13, GOOGL: 2800.16, ... },
    //   ...
    // ]
    // The goal is to group all the data points by timestamp
    // It's one of the keys when working with recharts
    // The root is all about how you group and structure your data
    const combinedPoints = uniqueTimestamps.map((timestamp) => {
      const point = { t: timestamp } as Record<string, number>

      // Add each stock's price for this timestamp
      Object.entries(stockPricesByTime).forEach(([symbol, prices]) => {
        // If the stock has a price for this timestamp, add it to the point
        // `prices[timestamp]` is the closing price for this stock at this timestamp
        // That's why when creating `stockPrices` we do `prices[point.t] = point.c`
        point[symbol] = prices[timestamp] ?? 0
      })

      return point
    })

    return combinedPoints
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
              // This is how shadcn works
              // you get colors by using the color variable and the key
              // in our case, symbol is the key
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
