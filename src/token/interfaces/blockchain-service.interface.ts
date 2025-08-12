export interface TokenData {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  contractAddress: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
}

export interface TokenAnalyticsData {
  price: string
  volume24h: string
  marketCap: string
  liquidity: string
  holderCount: number
  priceChange24h: string
  volumeChange24h: string
}

export interface TransactionData {
  hash: string
  from: string
  to: string
  amount: string
  valueUsd?: string
  type: string
  blockNumber: string
  timestamp: Date
  gasUsed: string
  gasPrice: string
}

export interface HolderData {
  address: string
  balance: string
  percentage: string
  transactionCount: number
  firstTransactionAt?: Date
  lastTransactionAt?: Date
}

export interface IBlockchainService {
  getTokenData(contractAddress: string): Promise<TokenData>
  getTokenAnalytics(contractAddress: string): Promise<TokenAnalyticsData>
  getTokenTransactions(contractAddress: string, limit?: number, offset?: number): Promise<TransactionData[]>
  getTokenHolders(contractAddress: string, limit?: number, offset?: number): Promise<HolderData[]>
  validateAddress(address: string): boolean
  getBlockchainType(): string
}
