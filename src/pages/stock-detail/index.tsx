import { useState } from 'react'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getTimeFormatter, Timeframe, timeframeConfig } from './utils/timeframe'
import { useParams } from 'react-router'
import { useCompanyInfo } from './hooks/useCompanyInfo'
import { useStockPrice } from './hooks/useStockPrice'
import { useChartData } from './hooks/useChartData'
import { useRSI } from './hooks/useRSI'
import { useSMA } from './hooks/useSMA'
import { useMACD } from './hooks/useMACD'

// Mapping for trade conditions
// More actually exist
// But this is fine for a side project
const CONDITIONS_MAP = {
  0: { label: 'Regular', class: 'bg-blue-500' },
  2: { label: 'Dark Pool', class: 'bg-purple-500' },
  37: { label: 'Odd Lot', class: 'bg-orange-500' },
} as const

// Chart config for different timeframes

const priceChartConfig = {
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

const technicalChartConfig = {
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

export function StockDetailPage() {
  const { symbol } = useParams()
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')

  const { chartData, isInitialChartDataLoading } = useChartData({
    symbol,
    timeframe,
  })

  const { data: companyData, isLoading: isCompanyDataLoading } =
    useCompanyInfo(symbol)

  // TODO: use the disconnected state and the other connection states to show to the user
  const { priceData, isLoadingInitialPriceData } = useStockPrice({
    symbol,
    timeframe,
  })

  const { data: rsiData, isLoading: isLoadingRSI } = useRSI({
    symbol,
    timeframe,
  })
  const { data: smaData, isLoading: isLoadingSMA } = useSMA({
    symbol,
    timeframe,
  })
  const { data: macdData, isLoading: isLoadingMACD } = useMACD({
    symbol,
    timeframe,
  })

  console.log({ smaData, macdData, rsiData })

  if (
    !companyData ||
    isCompanyDataLoading ||
    !priceData ||
    isLoadingInitialPriceData ||
    isInitialChartDataLoading ||
    !chartData ||
    isLoadingRSI ||
    isLoadingSMA ||
    isLoadingMACD
  )
    return <div>Loading...</div>

  console.log('chartData', chartData)

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">{companyData.ticker}</h1>
          <p className="text-xl text-muted-foreground">{companyData.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">${priceData.price.toFixed(2)}</p>
          <div
            className={cn('flex items-center justify-end text-lg', {
              'text-green-600': priceData.change >= 0,
              'text-red-600': priceData.change < 0,
            })}
          >
            {priceData.change >= 0 ? (
              <ArrowUpIcon className="h-5 w-5" />
            ) : (
              <ArrowDownIcon className="h-5 w-5" />
            )}
            <span>
              {Math.abs(priceData.change).toFixed(2)} (
              {Math.abs(priceData.changePercent).toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <Card className="w-full">
        <CardHeader>
          <Tabs
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as Timeframe)}
          >
            <TabsList>
              {Object.entries(timeframeConfig).map(([key, { label }]) => (
                <TabsTrigger key={key} value={key}>
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
                  tickFormatter={getTimeFormatter(timeframe)}
                />
                <YAxis domain={['auto', 'auto']} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="c"
                  stroke="var(--color-c)"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
          {/* Volume Chart Below */}
          <div className="mt-6 h-[200px] w-full">
            <ChartContainer config={priceChartConfig} className="h-full w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  tickFormatter={getTimeFormatter(timeframe)}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="v" fill="var(--color-v)" opacity={0.5} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col gap-2">
                {priceData.trades.map((trade, index) => (
                  <div
                    key={`${trade.timestamp}-${index}`}
                    className="flex items-center justify-between rounded p-2 hover:bg-muted/50"
                  >
                    <div>
                      <span className="font-mono">
                        ${trade.price.toFixed(2)}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {trade.size}
                      </span>
                    </div>
                    {trade.conditions.map((c) => (
                      <Badge key={c} variant="secondary">
                        {CONDITIONS_MAP[c as keyof typeof CONDITIONS_MAP]
                          ? CONDITIONS_MAP[c as keyof typeof CONDITIONS_MAP]
                              .label
                          : 'Other'}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* TODO: Allow show more (maybe) */}
              <p className="line-clamp-6 text-sm text-muted-foreground">
                {companyData.description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Market Cap
                  </p>
                  <p className="text-2xl">
                    {/* `1e12` is a shorthand for `10^12` which when we divide by it, we get the market cap in trillions */}
                    ${(companyData.market_cap / 1e12).toFixed(2)}T
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  tickFormatter={(tick) =>
                    typeof tick === 'number'
                      ? format(new Date(tick), 'HH:mm:ss')
                      : '---'
                  }
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

        {/* MACD */}
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

        {/* SMA */}
        <Card>
          <CardHeader>
            <CardTitle>SMA</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={technicalChartConfig}>
              <LineChart data={smaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(tick) =>
                    typeof tick === 'number'
                      ? format(new Date(tick), 'HH:mm:ss')
                      : '---'
                  }
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
      </div>
    </div>
  )
}
