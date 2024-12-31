import localforage from 'localforage'

const BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY = 'bookmarked-tickers'

export type BookmarkedTickers = Array<string>

export async function addBookmark(symbol: string) {
  const current = await getBookmarks()
  const updated = [...new Set([...current, symbol])]
  await localforage.setItem(BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY, updated)
  return updated
}

export async function removeBookmark(symbol: string) {
  const current = await getBookmarks()
  const updated = current.filter((s) => s !== symbol)
  await localforage.setItem(BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY, updated)
  return updated
}

export async function getBookmarks(): Promise<BookmarkedTickers> {
  const bookmarks = await localforage.getItem<BookmarkedTickers>(
    BOOKMARKED_TICKERS_LOCAL_STORAGE_KEY
  )
  return bookmarks || []
}

export async function isBookmarked(symbol: string) {
  const bookmarks = await getBookmarks()
  return bookmarks.includes(symbol)
}

export async function toggleBookmark(symbol: string) {
  if (await isBookmarked(symbol)) {
    return removeBookmark(symbol)
  }

  return addBookmark(symbol)
}
