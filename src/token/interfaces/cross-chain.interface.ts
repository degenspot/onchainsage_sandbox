export interface CrossChainTokenData {
  tokenId: string
  symbol: string
  name: string
  chainId: string
  chainName: string
  contractAddress: string
  price: string
  marketCap: string
  volume24h: string
  liquidity: string
  holderCount: number
  priceChange24h: string
}

export interface CrossChainComparison {
  symbol: string
  tokens: CrossChainTokenData[]
  totalMarketCap: string
  totalVolume24h: string
  totalLiquidity: string
  totalHolders: number
  averagePrice: string
  priceSpread: {
    min: CrossChainTokenData
    max: CrossChainTokenData
    spreadPercentage: string
  }
  volumeDistribution: {
    chainId: string
    chainName: string
    volume: string
    percentage: string
  }[]
}

export interface CrossChainPortfolio {
  totalValue: string
  chainDistribution: {
    chainId: string
    chainName: string
    value: string
    percentage: string
    tokenCount: number
  }[]
  topTokens: CrossChainTokenData[]
  performanceMetrics: {
    totalReturn24h: string
    totalReturnPercentage24h: string
    bestPerformer: CrossChainTokenData
    worstPerformer: CrossChainTokenData
  }
}

export interface CrossChainArbitrage {
  symbol: string
  opportunities: {
    buyChain: CrossChainTokenData
    sellChain: CrossChainTokenData
    profitPercentage: string
    profitUsd: string
    liquidityScore: number
  }[]
}

export interface CrossChainMarketData {
  totalMarketCap: string
  totalVolume24h: string
  chainMetrics: {
    chainId: string
    chainName: string
    marketCap: string
    volume24h: string
    tokenCount: number
    dominancePercentage: string
  }[]
  topCrossChainTokens: CrossChainTokenData[]
}
