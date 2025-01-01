import { Autocomplete } from '@/components/autocomplete'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Timeframe, timeframeConfig } from '@/lib/timeframe'
import { useQueryClient } from '@tanstack/react-query'
import { TIMEFRAME_KEY } from '@/lib/queryKeys'
import { useTimeframe } from '@/hooks/use-timeframe'
import { Skeleton } from '@/components/ui/skeleton'
import { useStockSearch } from './hooks/use-stock-search'
import { StockResult } from './types'
import { MultipleStocksChart } from './components/multiple-stocks-chart'
import { useMultipleStockData } from './hooks/use-multiple-stocks-data'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { STOCK_LIMITS } from './constants'

export function ComparePage() {
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set())

  const { status, results, setQuery } = useStockSearch()

  const timeframe = useTimeframe()
  const queryClient = useQueryClient()

  const updateTimeframe = (timeframe: Timeframe) => {
    queryClient.setQueryData(TIMEFRAME_KEY, timeframe)
  }

  const {
    multipleStocksData,
    isInitialMultipleStocksDataLoading,
    isMultipleStocksDataError,
  } = useMultipleStockData({
    symbols: Array.from(selectedStocks),
    timeframe,
  })

  function handleStockAdd(stock: StockResult) {
    if (selectedStocks.size >= STOCK_LIMITS.MAX_STOCKS) return

    setSelectedStocks((prev) => {
      const newSet = new Set(prev)
      newSet.add(stock.symbol)
      return newSet
    })
  }

  function handleStockRemove(symbol: string) {
    setSelectedStocks((prev) => {
      const newSet = new Set(prev)
      newSet.delete(symbol)
      return newSet
    })
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      <Card className="mx-auto w-[600px]">
        <CardHeader className="flex flex-col items-center">
          <CardTitle>Compare Stocks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select up to 5 stocks to compare their performance
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Autocomplete
            results={results}
            isLoading={status === 'loading'}
            onSearch={setQuery}
            itemToString={(item) => item?.symbol || ''}
            onSelect={handleStockAdd}
            renderItem={(stock, isHighlighted) => (
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm',
                  isHighlighted && 'bg-blue-100'
                )}
              >
                <span className="font-bold">{stock.symbol}</span> -
                <span className="line-clamp-1">{stock.name}</span>
              </div>
            )}
          />

          {selectedStocks.size > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(selectedStocks).map((symbol) => (
                <div
                  className="flex items-center gap-2 rounded-full bg-blue-100 px-2 py-1.5 text-sm text-blue-800"
                  key={symbol}
                >
                  <span className="text-sm">{symbol}</span>
                  <Button
                    className="size-auto rounded-full bg-blue-200 p-1 hover:bg-blue-300"
                    onClick={() => handleStockRemove(symbol)}
                  >
                    <XIcon size={16} className="text-blue-800" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isInitialMultipleStocksDataLoading && (
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
            </div>
          </CardContent>
        </Card>
      )}

      {selectedStocks.size > 0 &&
        !isInitialMultipleStocksDataLoading &&
        multipleStocksData && (
          <Card>
            <CardHeader>
              <Tabs
                value={timeframe}
                onValueChange={(value) => updateTimeframe(value as Timeframe)}
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
              <MultipleStocksChart
                data={multipleStocksData}
                timeframe={timeframe}
                isError={isMultipleStocksDataError}
              />
            </CardContent>
          </Card>
        )}
    </div>
  )
}
