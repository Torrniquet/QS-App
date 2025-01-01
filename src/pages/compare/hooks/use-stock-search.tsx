import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { StockResult } from '../types'
import { rest } from '@/lib/sdk'
import { BASE_STOCK_FILTERS } from '@/lib/constants'
import { STOCK_LIMITS } from '../constants'

export function useStockSearch(delay: number = STOCK_LIMITS.DEBOUNCE_DELAY) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [results, setResults] = useState<StockResult[]>([])

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
