import { Navigate, Route, Routes } from 'react-router'
import { RootLayout } from './layouts/RootLayout'
import { HomePage } from './pages/home'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StockDetailPage } from './pages/stock-detail'
import { BookmarksPage } from './pages/bookmarks'
import { NotFoundPage } from './pages/not-found'
import { ComparePage } from './pages/compare'
import { ROUTES } from './lib/constants'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route
            path={ROUTES.HOME}
            element={<Navigate to={ROUTES.SEARCH} replace />}
          />
          <Route path={ROUTES.SEARCH} element={<HomePage />} />
          <Route path={ROUTES.STOCK_DETAIL} element={<StockDetailPage />} />
          <Route path={ROUTES.BOOKMARKS} element={<BookmarksPage />} />
          <Route path={ROUTES.COMPARE} element={<ComparePage />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Route>
      </Routes>

      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
