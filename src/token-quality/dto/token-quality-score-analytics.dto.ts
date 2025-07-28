export interface TokenQualityScoreHistoryDto {
  timestamp: Date
  score: number
  onChainScore?: number
  socialScore?: number
  devScore?: number
}

export interface TokenQualitySummaryDto {
  tokenSymbol: string
  name: string
  currentQualityScore: number | null
  lastUpdated: Date | null
  onChainMetrics?: {
    volume24h: number
    activeHolders: string
    liquidity: number
    priceUsd: number
  }
  socialSentiment?: {
    sentimentScore: number
    mentionCount: number
  }
  developerActivity?: {
    commits24h: number
    uniqueContributors24h: number
    forks: number
    stars: number
  }
}
