import { StockCardSkeleton } from './StockCardSkeleton'
export function StockCardSkeletonList({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <StockCardSkeleton key={index} />
      ))}
    </div>
  )
}
