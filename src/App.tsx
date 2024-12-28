import { Navigate, Route, Routes } from 'react-router'
import { RootLayout } from './layouts/RootLayout'
import { HomePage } from './pages/home'

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/search" element={<HomePage />} />
      </Route>
    </Routes>
  )
}
