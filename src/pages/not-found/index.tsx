import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="container mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mb-2 text-lg text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to={ROUTES.SEARCH} prefetch="render">
          Go to search
        </Link>
      </Button>
    </div>
  )
}
