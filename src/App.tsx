import { Navigate, Route, Routes } from 'react-router'
import { RootLayout } from './layouts/RootLayout'
import { HomePage } from './pages/home'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<HomePage />} />
        </Route>
      </Routes>

      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
