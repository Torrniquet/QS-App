import { Route, Routes } from 'react-router'
import { RootLayout } from './layouts/RootLayout'
import { HomePage } from './pages/home'

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
      </Route>
    </Routes>
  )
}
