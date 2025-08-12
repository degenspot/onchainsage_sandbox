export interface TokenMetrics {
  tokenId: string
  symbol: string
  name: string
  chainId: string
  currentPrice: string
  priceChange24h: string
  priceChangePercentage24h: string
  volume24h: string
  volumeChange24h: string
  marketCap: string
  marketCapRank?: number
  liquidity: string
  holderCount: number
  holderChange24h: number
  transactionCount24h: number
  lastUpdated: Date
}

export interface HistoricalData {
  timestamp: Date
  price: string
  volume: string
  marketCap: string
  holderCount: number
}

export interface TokenComparison {
  tokenA: TokenMetrics
  tokenB: TokenMetrics
  priceRatio: string
  volumeRatio: string
  marketCapRatio: string
  holderRatio: string
}

export interface ChainAnalytics {
  chainId: string
  chainName: string
  totalTokens: number
  totalVolume24h: string
  totalMarketCap: string
  averagePrice: string
  topTokens: TokenMetrics[]
}

export interface AnalyticsFilters {
  chainIds?: string[]
  minMarketCap?: string
  maxMarketCap?: string
  minVolume24h?: string
  maxVolume24h?: string
  minHolders?: number
  maxHolders?: number
  sortBy?: "price" | "volume" | "marketCap" | "holders" | "priceChange"
  sortOrder?: "asc" | "desc"
  limit?: number
  offset?: number
}
