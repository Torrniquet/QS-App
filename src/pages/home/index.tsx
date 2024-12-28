import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from 'lucide-react'
import { Link } from 'react-router'

// Type definitions for our data structures
interface StockSnapshot {
  ticker: string
  name: string
  day: {
    c: number // close
    h: number // high
    l: number // low
    o: number // open
    v: number // volume
  }
  min: {
    av: number // accumulated volume
    c: number // close
    h: number // high
    l: number // low
    o: number // open
    t: number // timestamp
    v: number // volume
    vw: number // volume weighted
  }
  prevDay: {
    c: number // close price
  }
  todaysChange: number
  todaysChangePerc: number
}

// Mock data matching Polygon's snapshot endpoint structure
const popularStocks: StockSnapshot[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    day: {
      c: 150.25,
      h: 151.0,
      l: 149.5,
      o: 149.75,
      v: 65300000,
    },
    min: {
      av: 65300000,
      c: 150.25,
      h: 151.0,
      l: 149.5,
      o: 149.75,
      t: Date.now(),
      v: 3265000,
      vw: 150.0,
    },
    prevDay: {
      c: 147.75,
    },
    todaysChange: 2.5,
    todaysChangePerc: 1.69,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    day: {
      c: 378.92,
      h: 380.2,
      l: 376.15,
      o: 377.5,
      v: 22450000,
    },
    min: {
      av: 22450000,
      c: 378.92,
      h: 379.1,
      l: 378.5,
      o: 378.75,
      t: Date.now(),
      v: 1122500,
      vw: 378.85,
    },
    prevDay: {
      c: 376.17,
    },
    todaysChange: 2.75,
    todaysChangePerc: 0.73,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    day: {
      c: 142.65,
      h: 143.2,
      l: 141.6,
      o: 142.1,
      v: 28900000,
    },
    min: {
      av: 28900000,
      c: 142.65,
      h: 142.8,
      l: 142.4,
      o: 142.5,
      t: Date.now(),
      v: 1445000,
      vw: 142.6,
    },
    prevDay: {
      c: 141.8,
    },
    todaysChange: 0.85,
    todaysChangePerc: 0.6,
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    day: {
      c: 498.75,
      h: 499.5,
      l: 494.2,
      o: 495.0,
      v: 18750000,
    },
    min: {
      av: 18750000,
      c: 498.75,
      h: 499.0,
      l: 498.2,
      o: 498.5,
      t: Date.now(),
      v: 937500,
      vw: 498.6,
    },
    prevDay: {
      c: 492.5,
    },
    todaysChange: 6.25,
    todaysChangePerc: 1.27,
  },
]

const EXCHANGE_OPTIONS = [
  { label: 'NYSE', value: 'XNYS' },
  { label: 'NASDAQ', value: 'XNAS' },
  { label: 'AMEX', value: 'XASE' },
]

export function HomePage() {
  // State for filters - will be used when implementing search
  const [exchange, setExchange] = useState<string>()

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold">Stock Market Explorer</h1>

      {/* Search and Filters Section */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex flex-grow items-center gap-2">
          <Input placeholder="Search stocks..." className="flex-grow" />
          <Button>
            <SearchIcon className="h-4 w-4" />
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Select value={exchange} onValueChange={setExchange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Exchange" />
            </SelectTrigger>
            <SelectContent>
              {EXCHANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <h2 className="text-2xl font-bold">Popular Stocks</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Extract into its own StockCard component */}
        {/* Show search results here if they exist otherwise popular stocks */}
        {popularStocks.map((stock) => (
          <Card
            key={stock.ticker}
            className="transition-shadow hover:shadow-lg"
          >
            <Link to={`/stock/${stock.ticker}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{stock.ticker}</span>
                  <span
                    className={`text-lg ${stock.todaysChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    ${stock.day.c.toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-gray-600">{stock.name}</p>

                {/* Price Change and Volume */}
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1 ${stock.todaysChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {stock.todaysChange >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4" />
                    )}
                    {stock.todaysChange.toFixed(2)} (
                    {stock.todaysChangePerc.toFixed(2)}%)
                  </span>
                  <span className="text-sm text-gray-600">
                    {/* Divide by 10,000,000 to get millions */}
                    Vol: {(stock.day.v / 10_000_000).toFixed(1)}M
                  </span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
