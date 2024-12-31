import { useSearchParams } from 'react-router'
import { StockFilters } from '@/lib/schemas'
import { useSearchStocks } from './hooks/useSearchStocks'
import { PopularStocks } from './components/PopularStocks'
import { SearchStocks } from './components/SearchStocks'
import { QUERY_PARAMS } from '@/lib/constants'
import { SearchForm } from './components/SearchForm'

export function HomePage() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get(QUERY_PARAMS.SEARCH) || ''

  const exchange = searchParams.get(QUERY_PARAMS.EXCHANGE) || ''

  const stockFilters: StockFilters = {
    exchange,
    search,
  }

  const shouldShowSearchStocks = !!search
  const { data } = useSearchStocks(stockFilters)
  const totalResults = data?.pages.flatMap((page) => page.stocks).length ?? 0

  const title = shouldShowSearchStocks
    ? `Search Results (${totalResults})`
    : 'Popular Stocks'

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold">Stock Market Explorer</h1>

      <SearchForm />

      <h2 className="text-2xl font-bold">{title}</h2>
      {shouldShowSearchStocks ? <SearchStocks /> : <PopularStocks />}
    </div>
  )
}
