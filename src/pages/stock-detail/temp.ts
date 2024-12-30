// Mock data mirroring Polygon.io responses
export const mockData = {
  symbol: 'AAPL',
  // Latest trade from T.{symbol}
  lastTrade: {
    p: 150.25, // price
    s: 100, // size
    c: [0], // conditions (0 = regular)
    t: Date.now(), // timestamp
  },
  // Daily stats
  dayStats: {
    open: 149.25,
    prevClose: 148.75,
    change: 1.5,
    changePercent: 1.01,
    volume: 25345600,
  },
  // Technical indicators
  indicators: {
    sma: Array(50)
      .fill(0)
      .map((_, i) => ({
        timestamp: Date.now() - i * 60000,
        value: 150 + Math.sin(i / 10) * 2,
      })),
    rsi: Array(50)
      .fill(0)
      .map((_, i) => ({
        timestamp: Date.now() - i * 60000,
        value: 50 + Math.sin(i / 10) * 20,
      })),
    macd: Array(50)
      .fill(0)
      .map((_, i) => ({
        timestamp: Date.now() - i * 60000,
        value: Math.sin(i / 10) * 2, // Multiplied by 2
        signal: Math.sin((i + 5) / 10) * 2, // Increased offset and multiplied by 2
        histogram: Math.sin(i / 10) * 2 - Math.sin((i + 5) / 10) * 2, // Will be more visible
      })),
  },
  // Recent trades scrolling list
  recentTrades: Array(30)
    .fill(0)
    .map((_, i) => ({
      price: 150 + (Math.random() - 0.5),
      size: Math.floor(Math.random() * 1000),
      condition: [Math.floor(Math.random() * 3)] as number[], // 0=regular, 2=dark pool, 37=odd lot
      timestamp: Date.now() - i * 1000,
    })),
  // Real-time second data A.{symbol}
  realtimeData: Array(300)
    .fill(0)
    .map((_, i) => ({
      c: 150 + Math.sin(i / 50) * 2, // close price
      v: Math.floor(Math.random() * 1000), // volume
      s: Date.now() - (300 - i) * 1000, // timestamp
    })),
}
