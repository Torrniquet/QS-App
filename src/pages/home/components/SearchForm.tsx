import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useIsFetching } from '@tanstack/react-query'
import { StockFilters } from '@/lib/types'
import { stockKeys } from '@/lib/queryKeys'
import { QUERY_PARAMS } from '@/lib/constants'

const EXCHANGE_OPTIONS = [
  // New york stock exchange
  { label: 'NYSE', value: 'XNYS' },

  // Nasdaq
  { label: 'NASDAQ', value: 'XNAS' },

  // American stock exchange
  { label: 'AMEX', value: 'XASE' },
]

export function SearchForm() {
  const [searchParams, setSearchParams] = useSearchParams()
  const exchange = searchParams.get(QUERY_PARAMS.EXCHANGE) || ''
  const search = searchParams.get(QUERY_PARAMS.SEARCH) || ''

  const stockFilters: StockFilters = {
    exchange,
    search,
  }

  const handleExchangeChange = (newExchange: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (newExchange) {
        params.set(QUERY_PARAMS.EXCHANGE, newExchange)
      } else {
        params.delete(QUERY_PARAMS.EXCHANGE)
      }
      return params
    })
  }

  const isFetchingSearchStocks =
    useIsFetching({ queryKey: stockKeys.filtered(stockFilters) }) > 0

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isFetchingSearchStocks) return

    const formData = new FormData(event.target as HTMLFormElement)
    const search = formData.get(QUERY_PARAMS.SEARCH) as string
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set(QUERY_PARAMS.SEARCH, search)
      return params
    })
  }

  return (
    <div className="mb-4 flex items-center gap-8">
      <form
        className="flex flex-grow items-center gap-4"
        onSubmit={handleSearchSubmit}
      >
        <Input
          placeholder="Search stocks..."
          name={QUERY_PARAMS.SEARCH}
          aria-label="Search stocks..."
          defaultValue={search}
          required
          className="flex-grow"
        />
        <Button disabled={isFetchingSearchStocks}>
          <SearchIcon className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <Select value={exchange} onValueChange={handleExchangeChange}>
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
  )
}
