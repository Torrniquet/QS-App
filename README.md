# QS App

I built a stock market explorer (not responsive).

This let's you search, explore, bookmark and compare stocks.

I had a ton of fun working with sockets and charts haha 😄

https://github.com/user-attachments/assets/d871b836-301f-4a34-89b2-edec40cf5a57

Sorry video is too fast 😭

Had to compress and make it faster to get it under 10mb for github 🫠

---

I didn't build it mobile first. Fun and learning was the main focus. Some aspects are more responsive than others thanks to shadcn.

I will say though, the Polygon's SDK is a bit of a mess. It's so loosely typed. I did some inner typescript magic to have some stricter type safety.

Anyways, there is a lot to unpack here.

It'd be great if I gave you an introduction to the domain.

Then we can look over it page by page understanding the value of each page briefly which ties back to the domain knowledge.

After that we can dive into some interesting parts of the code.

# Introduction to domain

<details>
  <summary>🍿 Basics</summary>

---

What is a stock?

A share of stock represents partial ownership in a company. When you own stock, you own a piece of that business.

---

What is the stock market?

A network of exchanges where stocks are bought and sold. The NYSE and NASDAQ are the major U.S. exchanges. Stock prices change based on company performance, market conditions, and investor sentiment.

---

What is a ticker?

A ticker is a unique symbol assigned to a publicly traded company. It's used to identify the company on stock exchanges e.g. AAPL for Apple.

---

What is market cap?

Market capitalization = Current stock price × Total shares outstanding. This represents a company's total value in the market.

---

What is a dividend?

Regular payments some companies make to shareholders from their profits. Not all stocks pay dividends. Companies that do well pay dividends. It's a way for companies to share their success with shareholders. Some companies put all their money back into business, reinvesting in growth. Only stabe companies pay dividends.

---

What is volatility?

How much a stock's price moves up and down. Higher volatility means bigger price swings. This is good and bad. Good if it goes up, bad if it goes down.

---

What is volume?

Number of shares traded during a period. Higher volume usually means more active trading. Which also means it's easier to buy and sell because a lot of people are trading. If not many people are trading, it's harder to buy and sell because people tend to be more cautious.

</details>

<details>
  <summary>🍿 Trading hours</summary>

---

What are market hours?

Regular trading: 9:30 AM - 4:00 PM ET
Pre-market: 4:00 AM - 9:30 AM ET
After-hours: 4:00 PM - 8:00 PM ET

---

Why different hours?

Pre/After-hours trading started in the 1990s as electronic trading grew. Initially for institutional investors, now retail investors can trade extended hours through most brokers.

What's different about extended hours?

- Lower volume (fewer traders)
- Wider spreads (price gaps)
- More volatile
- Limited to certain order types
- Not all stocks trade actively

Key risks:

Pre/After-hours trades can be risky due to low liquidity and high volatility. Major news often breaks outside regular hours, causing large price swings.

---

What is liquidity?

How easily an asset can be bought/sold without causing a big price change. High liquidity means many buyers and sellers are active.

Examples:

- Apple stock: Very liquid (millions of shares trade daily)
- Small company stock: Less liquid (fewer traders, bigger price swings)

Why it matters:

- Low liquidity = harder to exit positions
- Can't always sell at expected price
- Wider spreads between buy/sell prices

</details>

<details>
  <summary>🍿 Indicators</summary>

---

What are indicators?

Tools that help you understand a stock's performance. They can be simple or complex.

Together along with other factors, they help you make a decision. Whether it's a buy, sell, or hold.

---

What is SMA?

SMA stands for Simple Moving Average. It's a line that shows the average price of a stock over a period of time.

---

What is RSI?

RSI stands for Relative Strength Index. It's a line that shows the strength of a stock over a period of time. Above 70 is considered overbought and below 30 is considered oversold.

Overbought means the stock is too expensive and it's likely to go down. Oversold means the stock is too cheap and it's likely to go up. This is a general rule of thumb. Think about it, if a stock is overbought, it's likely to go down because people are selling it. If a stock is oversold, it's likely to go up because people are buying it.

---

What is MACD?

MACD stands for Moving Average Convergence Divergence. It's a line that shows the difference between two moving averages. Here it's about tracking the difference between a 12 day and 26 day moving average. Recent average has more weight. The goal is to understand the momentum of a stock. The speed/acceleration of the stock.

</details>

# Introduction to the web app

This should be quick. Let's talk about all the pages and their values:

- **Search:** Search for a stock by name or ticker. We start by showing popular stocks to get you started.
- **Stock Detail:** Detailed information about a stock. See aggregated or real time data.
- **Bookmarks:** Bookmark a stock. This helps you quickly access your favorite stocks.
- **Compare:** Search, add multiple stocks and compare them. This works for both aggregated and real time data.

# Code explanations

I can't go through everything. But let's tackle some interesting parts throughout the entire codebase.

PS. As mentioned above, I'm working with the Polygon API using their SDK.

<details>
  <summary>🍿 How I enjoy working with React Query</summary>

---

- Qeury key factory pattern
- Custom hooks for the data consumptions

This keeps code clean and type safe.

My file with all the query keys:

```ts
import { StockFilters } from './schemas'
import { Timeframe } from './timeframe'

export const tickerKeys = {
  all: ['stocks'] as const,
  popular: () => [...tickerKeys.all, 'popular-stocks'] as const,
  filtered: (filters: StockFilters) => [...tickerKeys.all, filters] as const,
  bookmarked: () => [...tickerKeys.all, 'bookmarked'] as const,
}

export const snapshotKeys = {
  all: ['snapshots'] as const,
  popular: () => [...snapshotKeys.all, 'popular-stocks'] as const,
  bookmarked: () => [...snapshotKeys.all, 'bookmarked'] as const,
}

export const stockDetailKeys = {
  all: ['stock-detail'] as const,
  bySymbol: (symbol: string) => [...stockDetailKeys.all, symbol] as const,
  company: (symbol: string) =>
    [...stockDetailKeys.bySymbol(symbol), 'company'] as const,
  price: (symbol: string) =>
    [...stockDetailKeys.bySymbol(symbol), 'price'] as const,
  chart: (symbol: string, timeframe: string) =>
    [...stockDetailKeys.bySymbol(symbol), 'chart', timeframe] as const,
  technicals: {
    rsi: (symbol: string, timeframe: string) =>
      [
        ...stockDetailKeys.bySymbol(symbol),
        'technicals',
        'rsi',
        timeframe,
      ] as const,
    macd: (symbol: string, timeframe: string) =>
      [
        ...stockDetailKeys.bySymbol(symbol),
        'technicals',
        'macd',
        timeframe,
      ] as const,
    sma: (symbol: string, timeframe: string) =>
      [
        ...stockDetailKeys.bySymbol(symbol),
        'technicals',
        'sma',
        timeframe,
      ] as const,
  },
}

export const multiStockKeys = {
  all: ['multi-stock'] as const,
  byStocks: (stocks: Array<string>, timeframe: Timeframe) =>
    [...multiStockKeys.all, stocks, timeframe] as const,
}

export const TIMEFRAME_KEY = ['timeframe'] as const
```

</details>

<details>
  <summary>🍿 Searching for stocks</summary>

---

Let's take a look at the hook that searches for stocks.

My goal isn't to go over every line of code.

You can read up on the code or dig into the React Query docs for the useInfiniteQuery hook, which we use here instead of useQuery since we want infinite scrolling.

```ts
import { rest } from '@/lib/sdk'
import { BASE_STOCK_FILTERS } from '@/lib/constants'
import { tickerKeys } from '@/lib/queryKeys'
import { StockFilters } from '@/lib/schemas'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ITickersQuery } from '@polygon.io/client-js'
import { createStockLookupMap, transformStockData } from '@/lib/utils'

export function useSearchStocks(filters: StockFilters) {
  return useInfiniteQuery({
    queryKey: tickerKeys.filtered(filters),
    queryFn: async ({ pageParam }) => {
      const tickersResponse = await rest.reference.tickers({
        ...BASE_STOCK_FILTERS,
        search: filters.search,
        exchange: filters.exchange,
        cursor: pageParam ?? undefined,
        limit: 50,
      })

      if (!tickersResponse.results?.length) {
        return {
          stocks: [],
          nextCursor: null,
        }
      }

      const tickers = tickersResponse.results.map((result) => result.ticker)

      const snapshotsResponse = await rest.stocks.snapshotAllTickers({
        tickers: tickers.join(','),
      })

      const snapshotMap = createStockLookupMap({
        items: snapshotsResponse.tickers || [],
        getKey: (snapshot) => snapshot.ticker!,
      })

      const tickerDetailsMap = createStockLookupMap({
        items: tickersResponse.results,
        getKey: (ticker) => ticker.ticker,
      })

      // Transform the data
      const stocks = tickers.map((ticker) =>
        transformStockData(
          snapshotMap.get(ticker) || { ticker },
          tickerDetailsMap.get(ticker)
        )
      )

      return {
        stocks,
        nextCursor: tickersResponse.next_url
          ? tickersResponse.next_url.split('cursor=')[1]
          : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as ITickersQuery['cursor'],
    enabled: !!filters.search,
  })
}
```

One major key takeaway here is that the `queryFn` only cares about you passing in a promise.

This means a queryFn isn't strictly mapped to a fetch. You need to change your mental model. The queryFn is just a function that returns a promise. You decide what exactly you need to fetch and do before returning the promise.

Now in our case, the reason we need to do multiple requests is due to how the Polygon API works.

Initially, I made a mistake of having two hooks here. One for tickers and one for snapshots. This ended up in a rabbithole and disaster of managing and syncing the state.

Doing everything in a single queryFn function is 100x simpler.

</details>

<details>
  <summary>🍿 Keeping track of queries</summary>

---

If you look in our search form component, we do this:

```ts
const isFetchingSearchStocks =
  useIsFetching({ queryKey: tickerKeys.filtered(stockFilters) }) > 0
```

You can access anything from the cache. The state, etc. All you need is the right query key.

This is also why the query key factory pattern is so powerful.

`useIsFetching` tells you how many queries are fetching.

</details>

<details>
  <summary>🍿 Bookmarks</summary>

---

Let's go over bookmarks as it's not too complex. Look inside `src/lib/bookmarks.ts` for the code. We use `localforage` to store the bookmarks. Under the hood, it uses IndexedDB. If not available, it falls back to localStorage.

```ts
import localforage from 'localforage'

const BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY = 'bookmarked-tickers'

export type BookmarkedTickers = Array<string>

export async function addBookmark(symbol: string) {
  const current = await getBookmarks()
  const updated = [...new Set([...current, symbol])]
  await localforage.setItem(BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY, updated)
  return updated
}

export async function removeBookmark(symbol: string) {
  const current = await getBookmarks()
  const updated = current.filter((s) => s !== symbol)
  await localforage.setItem(BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY, updated)
  return updated
}

export async function getBookmarks(): Promise<BookmarkedTickers> {
  const bookmarks = await localforage.getItem<BookmarkedTickers>(
    BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY
  )
  return bookmarks || []
}

export async function isBookmarked(symbol: string) {
  const bookmarks = await getBookmarks()
  return bookmarks.includes(symbol)
}

export async function toggleBookmark(symbol: string) {
  if (await isBookmarked(symbol)) {
    return removeBookmark(symbol)
  }

  return addBookmark(symbol)
}
```

Code is pretty self explanatory.

</details>

<details>
  <summary>🍿 WebSocket and real time data</summary>

---

Web socket code can be found under `src/lib/websocket.ts`.

It's a big file.

When working with the Polygon API, you can use sockets for certain endpoints.

You can always only have a single socket connection.

How it works: You open a single socket connection and can subscribe to multiple subscriptions.

The subscriptions are mapped to handlers in the code.

Before we dive into some internals there, let's look at the a piece from useChartData hook to understand how to use the PolygonWS singleton instance:

```ts
// Hooks rule will complain here saying deps are unknown
// However this is fine
// Set state is referentially stable across re renders
// Meaning it won't change and trigger re renders
// So this is safe, and we can ignore the warning
const throttledProcessUpdates = useCallback(
  throttle(
    (
      batchedNewPoints: Array<ChartDataPoint>,
      existingPoints: Array<ChartDataPoint>
    ) => {
      const updatedData = [...existingPoints, ...batchedNewPoints].slice(
        -MAX_DATA_POINTS
      )
      setRealtimeData(updatedData)
      pendingUpdatesRef.current = []
    },
    THROTTLE_TIME_FOR_REAL_TIME_DATA
  ),
  []
)

const isRealtime = timeframe === '1D'
useEffect(() => {
  if (!symbol || !isRealtime) return

  const subscription = `A.${symbol}` as const

  polygonWS.addConnectionStateHandler(setConnectionState)

  const messageHandler = (messages: Array<WebSocketMessage>) => {
    messages.forEach((msg) => {
      const parsedMsg = chartDataWebSocketMessageSchema.parse(msg)
      const dataPoint: ChartDataPoint = {
        c: parsedMsg.c,
        h: parsedMsg.h,
        l: parsedMsg.l,
        o: parsedMsg.o,
        v: parsedMsg.v,
        t: parsedMsg.s,
        vw: parsedMsg.vw,
      }
      pendingUpdatesRef.current = [...pendingUpdatesRef.current, dataPoint]
    })
    throttledProcessUpdates(pendingUpdatesRef.current, realtimeData)
  }

  polygonWS.addMessageHandler(subscription, messageHandler)
  polygonWS.subscribe(subscription)

  return () => {
    polygonWS.removeMessageHandler(subscription, messageHandler)
    polygonWS.unsubscribe(subscription)
  }
}, [isRealtime, realtimeData, symbol, throttledProcessUpdates])
```

We're throttling the data to avoid too many updates. Otherwise it causes strain on the browser and the UI won't be as responsive. `pendingUpdatesRef` helps us keep track of the updates we need to process.

`connectionState` is a local state that we use to keep track of the connection state. We can use this to display to the user whether we're connected or not.

The way we use PolygonWS is that we subscribe to a subscription and add a message handler. This means whenever we get a message for this specific subscription, the message handler will be called.

We also do the same with the connection state handler. It's a way for us to immediately know whether we're connected or not. So we can show this to the user immediately.

Let's look at some of the socket code:

```js
type MessageHandler = (
  messages: Array<PriceDataWebSocketMessage | ChartDataWebSocketMessage>
) => void

type ConnectionStateHandler = (state: ConnectionState) => void

export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'authenticated'

class PolygonWebSocket<RawStringGeneric extends string> {
  private ws: w3cwebsocket | null = null

  // Map of subscription to set of handlers
  // This lets multiple handlers listen to a single subscription
  private messageHandlers = new Map<
    Subscription<RawStringGeneric>,
    Set<MessageHandler>
  >()

  // Set of handlers for connection state changes
  private connectionHandlers = new Set<ConnectionStateHandler>()

  private subscriptions = new Set<Subscription<RawStringGeneric>>()
  private reconnectAttempts = 0
  private connectionState: ConnectionState = 'disconnected'
```

Message handlers are a way for us to handle messages for a specific subscription. You can imagine multiple different components needing to handle the same subscription in different ways. This is what it lets them do. That's why we've a map of subscription to set of handlers.

Connection state handlers is self explanatory.

Reconnection attempts is needed to retry with exponential backoff when the socket gets disconnected.

Lastly, let's look at how we handle data messages, I think this is interesting:

```ts
  private handleDataMessages(messages: Array<WebSocketMessage>) {
    this.messageHandlers.forEach((handlers, subscription) => {
      const relevantMessages = messages.filter(
        (
          msg:
            | PriceDataWebSocketMessage
            | ChartDataWebSocketMessage
            | StatusMessage
        ): msg is PriceDataWebSocketMessage | ChartDataWebSocketMessage => {
          if (msg.ev === 'status') return false

          const [eventType, symbol] = subscription.split('.')
          return msg.ev === eventType && msg.sym === symbol
        }
      )

      if (relevantMessages.length > 0 && this.isAuthenticated()) {
        handlers.forEach((handler) => handler(relevantMessages))
      }
    })
  }
```

First, we ensure to filter out status messages. They're not relevant. They're used for things like authentication.

For each subscription, we filter out the messages that are relevant to that subscription. Subscription looks like this: `A.AAPL` in the format of `eventType.symbol`.

If the subscription is relevant and we're authenticated, we call all the handlers for that subscription.

</details>

<details>
  <summary>🍿 Working with charts</summary>

---

We use ShadCN and Recharts. Recharts does most of the heavy lifting.

We of course work with a lot of charts.

Let's take a quick look at the charts under `src/pages/stock-detail/components/price-chart.tsx`:

```jsx
<CardContent>
  {/* Price line chart */}
  <div className="h-[400px]">
    <ChartContainer config={priceChartConfig} className="h-full w-full">
      <LineChart data={chartData}>
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
              valueFormatter={(value) => `$${value.toLocaleString()}`}
            />
          }
        />
        <Line type="monotone" dataKey="c" stroke="var(--color-c)" dot={false} />
      </LineChart>
    </ChartContainer>
  </div>

  {/* Volume bar chart */}
  <div className="mt-6 h-[200px] w-full">
    <ChartContainer config={priceChartConfig} className="h-full w-full">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          minTickGap={25}
          tickFormatter={getTimeFormatter(timeframe)}
        />
        <YAxis />
        <ChartTooltip
          content={
            <ChartTooltipContent
              valueFormatter={(value) =>
                typeof value === 'number'
                  ? formatVolume(value)
                  : value.toLocaleString()
              }
            />
          }
        />
        <Bar dataKey="v" fill="var(--color-v)" opacity={0.5} />
      </BarChart>
    </ChartContainer>
  </div>
</CardContent>
```

Shape for chart data:

```ts
const chartData: {
  c: number // Close price
  t: number // Timestamp
  v: number // Volume
  o: number // Open price
  h: number // High price
  l: number // Low price
  vw?: number | undefined // VWAP
}[]
```

For the price line chart, `t` and `c` are the only required fields. We tell Recharts via `dataKey` which data to use. Tick formatter is how we format the x axis ticks (label at the bottom). `minTickGap` is the minimum gap between ticks. Recharts will remove ticks to make sure the gap is at least this amount. Good for not too tight x axis.

It's in the docs, but let's look over the config for chart container which comes from shadcn and not recharts:

```js
const priceChartConfig: {
    c: {
        label: string;
        color: string;
    };
    v: {
        label: string;
        color: string;
    };
}
```

The config is used to style the chart. As you can see, `c` and `v` are the only required fields. This is because they are the ones being used under `Bar` and `Line` respectively. You'll also see how we access the color from the config, via CSS variables in the format `--color-{key}`.

</details>

<details>
  <summary>🍿 Making the experience fast</summary>

---

Prefetching is the key player here.

See code plus `prefetchQuery` from React Query documentation.

</details>

<details>
  <summary>🍿 Compare page</summary>

---

The compare page is super interesting.

It's interactive and because we need to fetch data quite an amount of times since you can compare multiple stocks, we do heavy prefetching here. We even prefetch before you remove a stock. So if you remove a stock, the chart just updates smoothly.

We have an autocomplete component here created with downshift:

```jsx
import { Loader2 } from 'lucide-react'
import { useCombobox } from 'downshift'
import { Input } from './ui/input'
import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type InputProps = Omit<ComponentProps<'input'>, 'onSelect' | 'results'>

type AutocompleteProps<ResultValue> = InputProps & {
  results: Array<ResultValue>
  isLoading?: boolean
  onSearch: (value: string) => void
  onSelect: (item: ResultValue) => void
  renderItem: (item: ResultValue, active: boolean) => React.ReactNode
  onInputValueChange?: (changes: { inputValue: string | undefined }) => void
  itemToString?: (item: ResultValue | null) => string
  onSelectedItemChange?: (changes: {
    selectedItem: ResultValue | undefined
  }) => void
}

export function Autocomplete<ResultValue>({
  results,
  isLoading,
  onSearch,
  onSelect,
  renderItem,
  onInputValueChange,
  onSelectedItemChange,
  itemToString,
  ...inputProps
}: AutocompleteProps<ResultValue>) {
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items: results,
    // See: https://github.com/downshift-js/downshift/issues/964#issuecomment-595059407
    itemToString: itemToString,
    onInputValueChange: (changes) => {
      onSearch(changes.inputValue || '')
      onInputValueChange?.(changes)
    },
    onSelectedItemChange: (changes) => {
      if (changes.selectedItem) {
        onSelect(changes.selectedItem)
      }
      onSelectedItemChange?.(changes)
    },
  })

  const { className, ...rest } = inputProps

  return (
    <div className="relative">
      <Input
        {...getInputProps()}
        className={cn('w-full', className)}
        {...rest}
      />
      {isLoading && <Loader2 className="absolute right-2 top-2 animate-spin" />}

      {/* Can't conditionally render this */}
      {/* See: https://github.com/downshift-js/downshift/issues/1167#issuecomment-1088022842 */}
      <ul
        {...getMenuProps()}
        className={cn(
          'absolute z-10 mt-0.5 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg transition-all',
          {
            'border opacity-100': isOpen && results.length > 0,
            'pointer-events-none opacity-0': !isOpen || results.length === 0,
          }
        )}
      >
        {results.map((item, index) => (
          <li
            key={index}
            {...getItemProps({ item, index })}
            className="cursor-pointer"
          >
            {renderItem(item, highlightedIndex === index)}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Take your time and read the code if you want.

One thing I find interesting is the render callback pattern. Look at `renderItem`. Reminds me of why I love React haha

This is how we use the autocomplete component:

```jsx
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
        queryFn: () => api.getMultipleStockData(stocksToFetch, timeframe),
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
```

We also have a hook for searching for stock when typing into the autocomplete:

```jsx
export function useStockSearch(delay: number = STOCK_LIMITS.DEBOUNCE_DELAY) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [results, setResults] = useState<Array<StockResult>>([])

  const debouncedQuery = useDebounce(query, delay)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setResults([])
      setStatus('idle')
      return
    }

    setStatus('loading')
    try {
      const tickersResponse = await rest.reference.tickers({
        ...BASE_STOCK_FILTERS,
        search: searchQuery,
        limit: STOCK_LIMITS.SEARCH_RESULTS_LIMIT,
      })

      if (!tickersResponse.results?.length) {
        setResults([])
        setStatus('idle')
        return
      }

      const stocks = tickersResponse.results.map((result) => ({
        symbol: result.ticker,
        name: result.name,
      }))

      setResults(stocks)
      setStatus('success')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void search(debouncedQuery)
  }, [debouncedQuery, search])

  return { status, results, setQuery }
}
```

As you can see, we debounce the search. This is to prevent too many requests from being made.

useMultipleStockData is interesting but it's similar to the useChartData hook.

One thing that's crazy interesting is the multiple stocks component.

Because we need to create things dynamically, such as the chart config, since we don't know ahead of time, not just which symbols the user wants to compare, but how many of them:

```jsx
// This creates the chart config dynamically
// Will end up like:
// {
//   "AAPL": { label: "AAPL", color: "hsl(var(--color-aapl))" },
//   "GOOGL": { label: "GOOGL", color: "hsl(var(--color-googl))" },
//   ...
// }
function createChartConfig(symbols: Array<string>) {
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
  data: Record<string, Array<ChartDataPoint>>
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
```

The code itself is well documented. It's worth noting that CHART_COLORS aren't the usual chart colors. I created a set of new variables specifically for the compare page to make sure it's easy to differentiate between the different stocks.

</details>

<details>
  <summary>🍿 Global store for the timeframe</summary>

---

This is pretty cool. We're using React Query here.

Now, you may want this per page basis. We're using this throughout the app. We only have to pages that use chart so it's ok.

This is cool because it's a reactive global store, and if data doesn't exist, we just initialize it with the default value using `initialData`.

It's nice because if you prefetch cards on search page, you can prefetch by timeframe. If the timeframe isn't set (in case you've been on the site for a longer time), it'll just fallback to the default value.

```jsx
/**
 * This is a global store for the timeframe.
 * It should never expire
 */
export function useTimeframe() {
  const { data: timeframe } = useQuery({
    queryKey: TIMEFRAME_KEY,
    staleTime: Infinity,
    initialData: '1D' as Timeframe,
  })

  return timeframe
}
```

</details>

<details>
  <summary>🍿 Compare page data points fix</summary>

---

One weird issue I had was that when comapring stocks, their latest data points may be different. This means if META has newer trades after GOOGL, the chart would drop Google's prices to 0 till a new update comes in.

This looked horrible, because you had multiple timestamps where one stock did update but the other one didn't.

Which totally makes sense. They are different stocks and each trade is irrelevant to the other.

I fixed this by merging both old and new data points and making sure for every data point where the other stock didn't have a price, I used the last known price. This works perfect:

```ts
const throttledProcessUpdates = useCallback(
  throttle(
    (
      batchedUpdates: Record<string, Array<ChartDataPoint>>,
      currentData: MultipleStocksData
    ) => {
      // First, merge current and new data for each symbol
      // In the end we need to process all the data to ensure it looks good from
      // beginning to end and timestamps aren't messed up
      const dataWithNewPoints = Object.entries(batchedUpdates).reduce(
        (acc, [symbol, newPoints]) => ({
          ...acc,
          [symbol]: [...(currentData[symbol] || []), ...newPoints].slice(
            -STOCK_LIMITS.MAX_DATA_POINTS
          ),
        }),
        { ...currentData }
      )

      // Then normalize the merged data
      const finalData = normalizeMultipleStocksData(dataWithNewPoints)

      setRealtimeData(finalData)
      pendingUpdatesRef.current = {}
    },
    THROTTLE_TIME_FOR_REAL_TIME_DATA
  ),
  []
)
```

The normalize function is responsible for merging the data points and making sure the timestamps never get messed up:

```ts
/**
 * This function takes raw data points for multiple stocks
 * And ensures that all stocks have data points for all timestamps
 * If a stock is missing data for a timestamp, it uses the last known value
 * Unless it has no values yet (beginning of trading day)
 *
 * @param data - Raw data points for multiple stocks
 * @returns - Normalized data points for multiple stocks
 */
export function normalizeMultipleStocksData(
  data: MultipleStocksData
): MultipleStocksData {
  const allTimestamps = new Set<number>()

  // Get all unique timestamps and create a lookup map for each stock's points
  // This will end up like:
  // {
  //   'A.AAPL': {
  //     1719859200: { ... },
  //     1719859201: { ... },
  //     ...
  //   },
  //   ...
  // }
  const pointsBySymbolAndTimestamp = Object.entries(data).reduce(
    (currentObjWithAllPointsBySymbols, [symbol, points]) => {
      // Build lookup map for this symbol's points
      const pointMap = new Map<number, ChartDataPoint>()
      points.forEach((point) => {
        pointMap.set(point.t, point)
        allTimestamps.add(point.t)
      })

      return {
        ...currentObjWithAllPointsBySymbols,
        [symbol]: pointMap,
      }
    },
    {} as Record<string, Map<number, ChartDataPoint>>
  )

  // Sort timestamps once
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

  // Fill in missing points for each symbol
  // Will end up like:
  // {
  //   'A.AAPL': [
  //     { ... },
  //     { ... },
  //     ...
  //   ],
  //   ...
  // }
  // This is what's used as chart data
  return Object.entries(pointsBySymbolAndTimestamp).reduce(
    (acc, [symbol, pointMap]) => {
      let lastPoint: ChartDataPoint | null = null

      const filledPoints = sortedTimestamps
        .map((timestamp) => {
          const pointForCurrentTimestamp = pointMap.get(timestamp)

          // If we have one
          // Great, return it or the map
          if (pointForCurrentTimestamp) {
            lastPoint = pointForCurrentTimestamp
            return pointForCurrentTimestamp
          }

          // If not return null
          // Need to filter out nulls later
          // This can happen if the stock market has started
          // Let's say apple and google have started trading
          // But Meta has no trades yet
          // Then it is right to show meta as 0 while it doesn't have any trades
          // My point?
          // In the beginning of the stock market, when comparing stocks, in the beginning of the day, some stocks will have no trades
          // UI-wise doesn't look the best, but this is how it is as a fact
          if (!lastPoint) return null

          // If we have had a last point
          // Return it with the timestamp
          return {
            ...lastPoint,
            t: timestamp,
          }
        })
        .filter((point): point is ChartDataPoint => point !== null)

      return {
        ...acc,
        [symbol]: filledPoints,
      }
    },
    {} as MultipleStocksData
  )
}
```

</details>

# Tech used

- React
- React Query
- Downshift
- Shadcn
- Recharts
- Tailwind
- TypeScript
- Polygon API
- Zod
- Vercel
- WebSocket

# License

MIT

I'm adding it so that I don't get questions again if you can use my code :3

If it's open source, of course you can use it <3
