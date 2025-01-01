import { cn } from '@/lib/utils'
import { ConnectionState, CONNECTION_STATE_LABEL_MAP } from '@/lib/websocket'

export function ConnectionTag({
  connectionState,
}: {
  connectionState: ConnectionState
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border p-2"
      // Needed to override card header inner styles
      style={{
        marginTop: 0,
      }}
    >
      <div
        className={cn('size-3 rounded-full', {
          'bg-green-500':
            connectionState === 'connected' ||
            connectionState === 'authenticated',
          'bg-yellow-500': connectionState === 'connecting',
          'bg-red-500': connectionState === 'disconnected',
        })}
      />
      <p className="text-xs font-bold">
        {CONNECTION_STATE_LABEL_MAP[connectionState]}
      </p>
    </div>
  )
}
