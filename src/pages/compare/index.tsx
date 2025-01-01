import { Autocomplete } from '@/components/autocomplete'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Timeframe, timeframeConfig } from '@/lib/timeframe'
import { useQueryClient } from '@tanstack/react-query'
import { multiStockKeys, TIMEFRAME_KEY } from '@/lib/queryKeys'
import { useTimeframe } from '@/hooks/use-timeframe'
import { Skeleton } from '@/components/ui/skeleton'
import { useStockSearch } from './hooks/use-stock-search'
import { StockResult } from './types'
import { MultipleStocksChart } from './components/multiple-stocks-chart'
import { useMultipleStockData } from './hooks/use-multiple-stocks-data'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { STOCK_LIMITS } from './constants'
import { api } from '@/lib/api'

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

  // PS. The prefetching things I just lov to play around with to see how they shape the experience
  // In an actual production app, you'd wanna be careful with the amount of requests you could be making
  // e.g. if users are on mobile, you don't wanna make the experience laggy

  function prefetchStocksForTabs(tabTimeframe: Timeframe) {
    if (selectedStocks.size === 0) return

    void queryClient.prefetchQuery({
      queryKey: multiStockKeys.bySymbols(
        Array.from(selectedStocks),
        tabTimeframe
      ),
      queryFn: () =>
        api.getMultipleStockData(Array.from(selectedStocks), tabTimeframe),
    })
  }

  function prefetchStockData(hoveredSymbol: string) {
    if (!hoveredSymbol) return

    // This is a hack for calculating the potential future key ahead of time
    // We can prefetch like this when hovering or focusing on the autocomplete
    const symbolsToFetch = Array.from(
      new Set([...Array.from(selectedStocks), hoveredSymbol])
    )

    void queryClient.prefetchQuery({
      queryKey: multiStockKeys.bySymbols(symbolsToFetch, timeframe),
      queryFn: () => api.getMultipleStockData(symbolsToFetch, timeframe),
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
            renderItem={(stock, isHighlighted) => {
              if (isHighlighted) {
                const symbolsToFetch = Array.from(
                  new Set([...Array.from(selectedStocks), stock.symbol])
                )

                void queryClient.prefetchQuery({
                  queryKey: multiStockKeys.bySymbols(symbolsToFetch, timeframe),
                  queryFn: () =>
                    api.getMultipleStockData(symbolsToFetch, timeframe),
                })
              }

              return (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm',
                    isHighlighted && 'bg-blue-100'
                  )}
                  onMouseEnter={() => prefetchStockData(stock.symbol)}
                  onFocus={() => prefetchStockData(stock.symbol)}
                >
                  <span className="font-bold">{stock.symbol}</span> -
                  <span className="line-clamp-1">{stock.name}</span>
                </div>
              )
            }}
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

      {selectedStocks.size > 0 && (
        <Card>
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
                    onMouseEnter={() => prefetchStocksForTabs(key as Timeframe)}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isMultipleStocksDataError ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Unable to load chart data
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    void queryClient.invalidateQueries({
                      queryKey: multiStockKeys.bySymbols(
                        Array.from(selectedStocks),
                        timeframe
                      ),
                    })
                  }
                >
                  Try again
                </Button>
              </div>
            ) : multipleStocksData ? (
              <MultipleStocksChart
                data={multipleStocksData}
                timeframe={timeframe}
              />
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}