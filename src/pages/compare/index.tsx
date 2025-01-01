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
import React, { useCallback, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { STOCK_LIMITS } from './constants'
import { api } from '@/lib/api'
import { MultipleStocksData } from '@/lib/schemas'
import { ConnectionState } from '@/lib/websocket'
import { ConnectionTag } from '@/components/connection-tag'

const StockSearch = React.memo(function StockSearch({
  onStockAdd,
  onStockRemove,
  selectedStocks,
}: {
  onStockAdd: (stockResult: StockResult) => void
  onStockRemove: (stock: string) => void
  selectedStocks: Set<string>
}) {
  const { status, results, setQuery } = useStockSearch()
  const timeframe = useTimeframe()
  const queryClient = useQueryClient()

  function prefetchStockData(hoveredStock: string) {
    if (!hoveredStock) return

    // This is a hack for calculating the potential future key ahead of time
    // We can prefetch like this when hovering or focusing on the autocomplete
    const stocksToFetch = Array.from(
      new Set([...Array.from(selectedStocks), hoveredStock])
    )

    void queryClient.prefetchQuery({
      queryKey: multiStockKeys.byStocks(stocksToFetch, timeframe),
      queryFn: () => api.getMultipleStockData(stocksToFetch, timeframe),
    })
  }

  return (
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
          onSelect={onStockAdd}
          renderItem={(stock, isHighlighted) => {
            if (isHighlighted) {
              const stocksToFetch = Array.from(
                new Set([...Array.from(selectedStocks), stock.symbol])
              )

              void queryClient.prefetchQuery({
                queryKey: multiStockKeys.byStocks(stocksToFetch, timeframe),
                queryFn: () =>
                  api.getMultipleStockData(stocksToFetch, timeframe),
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

        <SelectedStocks stocks={selectedStocks} onRemove={onStockRemove} />
      </CardContent>
    </Card>
  )
})

const SelectedStocks = React.memo(function SelectedStocks({
  stocks,
  onRemove,
}: {
  stocks: Set<string>
  onRemove: (stock: string) => void
}) {
  const queryClient = useQueryClient()
  const timeframe = useTimeframe()

  function prefetchStocksIfTagWasRemoved(hoveredStock: string) {
    if (!stocks.has(hoveredStock)) return

    const stocksWithoutHoveredStock = Array.from(stocks).filter(
      (stock) => stock !== hoveredStock
    )

    void queryClient.prefetchQuery({
      queryKey: multiStockKeys.byStocks(stocksWithoutHoveredStock, timeframe),
      queryFn: () =>
        api.getMultipleStockData(stocksWithoutHoveredStock, timeframe),
    })
  }

  if (stocks.size === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(stocks).map((stock) => (
        <div
          className="flex items-center gap-2 rounded-full bg-blue-100 px-2 py-1.5 text-sm text-blue-800"
          key={stock}
          onMouseEnter={() => prefetchStocksIfTagWasRemoved(stock)}
        >
          <span className="text-sm">{stock}</span>
          <Button
            className="size-auto rounded-full bg-blue-200 p-1 hover:bg-blue-300"
            onClick={() => onRemove(stock)}
          >
            <XIcon size={16} className="text-blue-800" />
          </Button>
        </div>
      ))}
    </div>
  )
})

const StockChart = React.memo(function StockInnerChart({
  selectedStocks,
  data,
  isLoading,
  isError,
  connectionState,
  isDataRealtime,
}: {
  selectedStocks: Set<string>
  data: MultipleStocksData | undefined
  isLoading: boolean
  isError: boolean
  connectionState: ConnectionState
  isDataRealtime: boolean
}) {
  const queryClient = useQueryClient()
  const timeframe = useTimeframe()

  const updateTimeframe = (timeframe: Timeframe) => {
    queryClient.setQueryData(TIMEFRAME_KEY, timeframe)
  }

  // PS. The prefetching things I just lov to play around with to see how they shape the experience
  // In an actual production app, you'd wanna be careful with the amount of requests you could be making
  // e.g. if users are on mobile, you don't wanna make the experience laggy
  function prefetchStocksForTabs(tabTimeframe: Timeframe) {
    if (selectedStocks.size === 0) return

    void queryClient.prefetchQuery({
      queryKey: multiStockKeys.byStocks(
        Array.from(selectedStocks),
        tabTimeframe
      ),
      queryFn: () =>
        api.getMultipleStockData(Array.from(selectedStocks), tabTimeframe),
    })
  }

  if (isLoading) {
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
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedStocks.size === 0) return null

  return (
    <Card>
      <CardHeader
        className={cn('flex flex-row items-center', {
          'justify-between': isDataRealtime,
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
                onMouseEnter={() => prefetchStocksForTabs(key as Timeframe)}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isDataRealtime && <ConnectionTag connectionState={connectionState} />}
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">
              Unable to load chart data (market could be down)
            </p>
            <Button
              variant="outline"
              onClick={() =>
                void queryClient.invalidateQueries({
                  queryKey: multiStockKeys.byStocks(
                    Array.from(selectedStocks),
                    timeframe
                  ),
                })
              }
            >
              Try again
            </Button>
          </div>
        ) : data ? (
          <MultipleStocksChart data={data} timeframe={timeframe} />
        ) : null}
      </CardContent>
    </Card>
  )
})

export function ComparePage() {
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set())

  const timeframe = useTimeframe()

  const {
    multipleStocksData,
    isInitialMultipleStocksDataLoading,
    isMultipleStocksDataError,
    isMultipleStocksDataRealtime,
    multipleStocksDataConnectionState,
  } = useMultipleStockData({
    stocks: Array.from(selectedStocks),
    timeframe,
  })

  const handleStockAdd = useCallback(
    (stock: StockResult) => {
      if (selectedStocks.size >= STOCK_LIMITS.MAX_STOCKS) return

      setSelectedStocks((prev) => {
        const newSet = new Set(prev)
        newSet.add(stock.symbol)
        return newSet
      })
    },
    [selectedStocks.size]
  )

  const handleStockRemove = useCallback((stock: string) => {
    setSelectedStocks((prev) => {
      const newSet = new Set(prev)
      newSet.delete(stock)
      return newSet
    })
  }, [])

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      <StockSearch
        onStockAdd={handleStockAdd}
        onStockRemove={handleStockRemove}
        selectedStocks={selectedStocks}
      />
      <StockChart
        selectedStocks={selectedStocks}
        data={multipleStocksData}
        isLoading={isInitialMultipleStocksDataLoading}
        isError={isMultipleStocksDataError}
        connectionState={multipleStocksDataConnectionState}
        isDataRealtime={isMultipleStocksDataRealtime}
      />
    </div>
  )
}
