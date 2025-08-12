import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { HttpException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { jest } from "@jest/globals"

// Entities
import { Blockchain } from "./entities/blockchain.entity"
import { Token } from "./entities/token.entity"
import { TokenAnalytics } from "./entities/token-analytics.entity"
import { TokenTransaction } from "./entities/token-transaction.entity"
import { TokenHolder } from "./entities/token-holder.entity"

// Services
import { TokenAnalyticsService } from "./services/analytics/token-analytics.service"
import { CrossChainAnalyticsService } from "./services/cross-chain/cross-chain-analytics.service"
import { BlockchainDataService } from "./services/blockchain/blockchain-data.service"
import { BlockchainFactoryService } from "./services/blockchain/blockchain-factory.service"
import { CacheService } from "./services/analytics/cache.service"

// Controllers
import { TokensController } from "./controllers/tokens.controller"
import { AnalyticsController } from "./controllers/analytics.controller"
import { CrossChainController } from "./controllers/cross-chain.controller"

// DTOs
import type { SearchTokensDto, AddTokenDto } from "./dto/token.dto"
import type { CrossChainComparisonDto, CrossChainPortfolioDto } from "./dto/cross-chain.dto"

describe("Multi-Chain Token Explorer", () => {
  let module: TestingModule

  // Services
  let tokenAnalyticsService: TokenAnalyticsService
  let crossChainAnalyticsService: CrossChainAnalyticsService
  let blockchainDataService: BlockchainDataService
  let blockchainFactoryService: BlockchainFactoryService
  let cacheService: CacheService

  // Controllers
  let tokensController: TokensController
  let analyticsController: AnalyticsController
  let crossChainController: CrossChainController

  // Repository mocks
  let tokenRepository: jest.Mocked<Repository<Token>>
  let blockchainRepository: jest.Mocked<Repository<Blockchain>>
  let analyticsRepository: jest.Mocked<Repository<TokenAnalytics>>
  let transactionRepository: jest.Mocked<Repository<TokenTransaction>>
  let holderRepository: jest.Mocked<Repository<TokenHolder>>

  // Mock data
  const mockBlockchain: Blockchain = {
    id: "blockchain-1",
    name: "Ethereum",
    chainId: "1",
    type: "EVM",
    nativeCurrency: "ETH",
    rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/test",
    explorerUrl: "https://etherscan.io",
    isActive: true,
    tokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockToken: Token = {
    id: "token-1",
    name: "Test Token",
    symbol: "TEST",
    contractAddress: "0x1234567890123456789012345678901234567890",
    decimals: 18,
    description: "A test token",
    logoUrl: "https://example.com/logo.png",
    websiteUrl: "https://example.com",
    totalSupply: "1000000000000000000000000",
    circulatingSupply: "800000000000000000000000",
    blockchain: mockBlockchain,
    analytics: [],
    transactions: [],
    holders: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockTokenAnalytics: TokenAnalytics = {
    id: "analytics-1",
    token: mockToken,
    price: "100.50",
    volume24h: "1000000.00",
    marketCap: "80000000000.00",
    liquidity: "5000000.00",
    holderCount: 10000,
    priceChange24h: "5.25",
    volumeChange24h: "15.30",
    timestamp: new Date(),
    createdAt: new Date(),
  }

  const mockRepositoryFactory = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
    manager: {
      findOne: jest.fn(),
    },
  })

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      providers: [
        TokenAnalyticsService,
        CrossChainAnalyticsService,
        BlockchainDataService,
        BlockchainFactoryService,
        CacheService,
        ConfigService,
        {
          provide: getRepositoryToken(Token),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(Blockchain),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(TokenAnalytics),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(TokenTransaction),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(TokenHolder),
          useFactory: mockRepositoryFactory,
        },
      ],
      controllers: [TokensController, AnalyticsController, CrossChainController],
    })

    module = await moduleBuilder.compile()

    // Get services
    tokenAnalyticsService = module.get<TokenAnalyticsService>(TokenAnalyticsService)
    crossChainAnalyticsService = module.get<CrossChainAnalyticsService>(CrossChainAnalyticsService)
    blockchainDataService = module.get<BlockchainDataService>(BlockchainDataService)
    blockchainFactoryService = module.get<BlockchainFactoryService>(BlockchainFactoryService)
    cacheService = module.get<CacheService>(CacheService)

    // Get controllers
    tokensController = module.get<TokensController>(TokensController)
    analyticsController = module.get<AnalyticsController>(AnalyticsController)
    crossChainController = module.get<CrossChainController>(CrossChainController)

    // Get repository mocks
    tokenRepository = module.get(getRepositoryToken(Token))
    blockchainRepository = module.get(getRepositoryToken(Blockchain))
    analyticsRepository = module.get(getRepositoryToken(TokenAnalytics))
    transactionRepository = module.get(getRepositoryToken(TokenTransaction))
    holderRepository = module.get(getRepositoryToken(TokenHolder))
  })

  afterEach(async () => {
    await module.close()
  })

  describe("Entity Tests", () => {
    it("should create a blockchain entity", () => {
      expect(mockBlockchain).toBeDefined()
      expect(mockBlockchain.name).toBe("Ethereum")
      expect(mockBlockchain.chainId).toBe("1")
      expect(mockBlockchain.type).toBe("EVM")
    })

    it("should create a token entity with blockchain relationship", () => {
      expect(mockToken).toBeDefined()
      expect(mockToken.symbol).toBe("TEST")
      expect(mockToken.blockchain).toBe(mockBlockchain)
      expect(mockToken.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it("should create token analytics entity", () => {
      expect(mockTokenAnalytics).toBeDefined()
      expect(mockTokenAnalytics.token).toBe(mockToken)
      expect(Number.parseFloat(mockTokenAnalytics.price)).toBeGreaterThan(0)
    })
  })

  describe("CacheService", () => {
    it("should cache and retrieve data", () => {
      const testData = { test: "data" }
      const key = "test-key"

      cacheService.set(key, testData)
      const retrieved = cacheService.get(key)

      expect(retrieved).toEqual(testData)
    })

    it("should return null for expired cache", async () => {
      const testData = { test: "data" }
      const key = "test-key"
      const shortTtl = 10 // 10ms

      cacheService.set(key, testData, shortTtl)

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 20))

      const retrieved = cacheService.get(key)
      expect(retrieved).toBeNull()
    })

    it("should cache token metrics", () => {
      const tokenId = "token-1"
      const metrics = {
        tokenId,
        symbol: "TEST",
        name: "Test Token",
        chainId: "1",
        currentPrice: "100.50",
        priceChange24h: "5.25",
        priceChangePercentage24h: "5.5",
        volume24h: "1000000.00",
        volumeChange24h: "15.30",
        marketCap: "80000000000.00",
        liquidity: "5000000.00",
        holderCount: 10000,
        holderChange24h: 100,
        transactionCount24h: 500,
        lastUpdated: new Date(),
      }

      cacheService.cacheTokenMetrics(tokenId, metrics)
      const retrieved = cacheService.getTokenMetrics(tokenId)

      expect(retrieved).toEqual(metrics)
    })
  })

  describe("TokenAnalyticsService", () => {
    it("should get token metrics", async () => {
      const tokenId = "token-1"

      tokenRepository.findOne.mockResolvedValue(mockToken)
      analyticsRepository.findOne.mockResolvedValue(mockTokenAnalytics)
      holderRepository.count.mockResolvedValue(10000)
      transactionRepository.count.mockResolvedValue(500)

      const metrics = await tokenAnalyticsService.getTokenMetrics(tokenId)

      expect(metrics).toBeDefined()
      expect(metrics?.tokenId).toBe(tokenId)
      expect(metrics?.symbol).toBe("TEST")
      expect(metrics?.currentPrice).toBe("100.50")
    })

    it("should return null for non-existent token", async () => {
      const tokenId = "non-existent"

      tokenRepository.findOne.mockResolvedValue(null)

      const metrics = await tokenAnalyticsService.getTokenMetrics(tokenId)

      expect(metrics).toBeNull()
    })

    it("should get historical data", async () => {
      const tokenId = "token-1"
      const days = 7

      const mockHistoricalData = [
        { ...mockTokenAnalytics, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { ...mockTokenAnalytics, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { ...mockTokenAnalytics, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      ]

      analyticsRepository.find.mockResolvedValue(mockHistoricalData)

      const historicalData = await tokenAnalyticsService.getHistoricalData(tokenId, days)

      expect(historicalData).toHaveLength(3)
      expect(historicalData[0].price).toBe("100.50")
    })

    it("should compare two tokens", async () => {
      const tokenAId = "token-1"
      const tokenBId = "token-2"

      const mockTokenB = { ...mockToken, id: "token-2", symbol: "TEST2" }
      const mockAnalyticsB = { ...mockTokenAnalytics, price: "200.00" }

      // Mock getTokenMetrics calls
      jest.spyOn(tokenAnalyticsService, "getTokenMetrics").mockImplementation(async (id) => {
        if (id === tokenAId) {
          return {
            tokenId: tokenAId,
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            currentPrice: "100.50",
            priceChange24h: "5.25",
            priceChangePercentage24h: "5.5",
            volume24h: "1000000.00",
            volumeChange24h: "15.30",
            marketCap: "80000000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            holderChange24h: 100,
            transactionCount24h: 500,
            lastUpdated: new Date(),
          }
        }
        if (id === tokenBId) {
          return {
            tokenId: tokenBId,
            symbol: "TEST2",
            name: "Test Token 2",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            currentPrice: "200.00",
            priceChange24h: "10.50",
            priceChangePercentage24h: "5.5",
            volume24h: "2000000.00",
            volumeChange24h: "25.60",
            marketCap: "160000000000.00",
            liquidity: "10000000.00",
            holderCount: 20000,
            holderChange24h: 200,
            transactionCount24h: 1000,
            lastUpdated: new Date(),
          }
        }
        return null
      })

      const comparison = await tokenAnalyticsService.compareTokens(tokenAId, tokenBId)

      expect(comparison).toBeDefined()
      expect(comparison?.tokenA.symbol).toBe("TEST")
      expect(comparison?.tokenB.symbol).toBe("TEST2")
      expect(Number.parseFloat(comparison?.priceRatio || "0")).toBeCloseTo(0.5, 1)
    })
  })

  describe("CrossChainAnalyticsService", () => {
    it("should get cross-chain token data", async () => {
      const symbol = "TEST"

      const mockTokens = [
        { ...mockToken, blockchain: { ...mockBlockchain, chainId: "1", name: "Ethereum" } },
        { ...mockToken, id: "token-2", blockchain: { ...mockBlockchain, chainId: "56", name: "BSC" } },
      ]

      tokenRepository.find.mockResolvedValue(mockTokens)

      // Mock getTokenMetrics for each token
      jest.spyOn(tokenAnalyticsService, "getTokenMetrics").mockResolvedValue({
        tokenId: "token-1",
        symbol: "TEST",
        name: "Test Token",
        chainId: "1",
        chainName: "Ethereum",
        contractAddress: "0x1234567890123456789012345678901234567890",
        currentPrice: "100.50",
        priceChange24h: "5.25",
        priceChangePercentage24h: "5.5",
        volume24h: "1000000.00",
        volumeChange24h: "15.30",
        marketCap: "80000000000.00",
        liquidity: "5000000.00",
        holderCount: 10000,
        holderChange24h: 100,
        transactionCount24h: 500,
        lastUpdated: new Date(),
      })

      const crossChainData = await crossChainAnalyticsService.getCrossChainTokenData(symbol)

      expect(crossChainData).toHaveLength(2)
      expect(crossChainData[0].symbol).toBe("TEST")
      expect(crossChainData[0].chainId).toBe("1")
    })

    it("should compare cross-chain token", async () => {
      const symbol = "TEST"

      jest.spyOn(crossChainAnalyticsService, "getCrossChainTokenData").mockResolvedValue([
        {
          tokenId: "token-1",
          symbol: "TEST",
          name: "Test Token",
          chainId: "1",
          chainName: "Ethereum",
          contractAddress: "0x1234567890123456789012345678901234567890",
          price: "100.50",
          marketCap: "80000000000.00",
          volume24h: "1000000.00",
          liquidity: "5000000.00",
          holderCount: 10000,
          priceChange24h: "5.5",
        },
        {
          tokenId: "token-2",
          symbol: "TEST",
          name: "Test Token",
          chainId: "56",
          chainName: "BSC",
          contractAddress: "0x9876543210987654321098765432109876543210",
          price: "95.00",
          marketCap: "76000000000.00",
          volume24h: "800000.00",
          liquidity: "4000000.00",
          holderCount: 8000,
          priceChange24h: "3.2",
        },
      ])

      const comparison = await crossChainAnalyticsService.compareCrossChainToken(symbol)

      expect(comparison).toBeDefined()
      expect(comparison?.symbol).toBe("TEST")
      expect(comparison?.tokens).toHaveLength(2)
      expect(Number.parseFloat(comparison?.priceSpread.spreadPercentage || "0")).toBeGreaterThan(0)
    })

    it("should find arbitrage opportunities", async () => {
      const symbol = "TEST"
      const minProfitPercentage = 2

      jest.spyOn(crossChainAnalyticsService, "getCrossChainTokenData").mockResolvedValue([
        {
          tokenId: "token-1",
          symbol: "TEST",
          name: "Test Token",
          chainId: "1",
          chainName: "Ethereum",
          contractAddress: "0x1234567890123456789012345678901234567890",
          price: "100.00",
          marketCap: "80000000000.00",
          volume24h: "1000000.00",
          liquidity: "5000000.00",
          holderCount: 10000,
          priceChange24h: "5.5",
        },
        {
          tokenId: "token-2",
          symbol: "TEST",
          name: "Test Token",
          chainId: "56",
          chainName: "BSC",
          contractAddress: "0x9876543210987654321098765432109876543210",
          price: "105.00",
          marketCap: "84000000000.00",
          volume24h: "800000.00",
          liquidity: "4000000.00",
          holderCount: 8000,
          priceChange24h: "3.2",
        },
      ])

      const arbitrage = await crossChainAnalyticsService.findArbitrageOpportunities(symbol, minProfitPercentage)

      expect(arbitrage).toBeDefined()
      expect(arbitrage?.opportunities).toHaveLength(1)
      expect(Number.parseFloat(arbitrage?.opportunities[0].profitPercentage || "0")).toBeGreaterThanOrEqual(
        minProfitPercentage,
      )
    })
  })

  describe("TokensController", () => {
    it("should search tokens", async () => {
      const searchDto: SearchTokensDto = {
        query: "TEST",
        limit: 10,
        offset: 0,
      }

      const mockTokenMetrics = [
        {
          tokenId: "token-1",
          symbol: "TEST",
          name: "Test Token",
          chainId: "1",
          currentPrice: "100.50",
          priceChange24h: "5.25",
          priceChangePercentage24h: "5.5",
          volume24h: "1000000.00",
          volumeChange24h: "15.30",
          marketCap: "80000000000.00",
          liquidity: "5000000.00",
          holderCount: 10000,
          holderChange24h: 100,
          transactionCount24h: 500,
          lastUpdated: new Date(),
        },
      ]

      jest.spyOn(tokenAnalyticsService, "getFilteredTokens").mockResolvedValue(mockTokenMetrics)

      const result = await tokensController.searchTokens(searchDto)

      expect(result).toHaveLength(1)
      expect(result[0].symbol).toBe("TEST")
    })

    it("should get token by id", async () => {
      const tokenId = "token-1"

      tokenRepository.findOne.mockResolvedValue(mockToken)

      const result = await tokensController.getToken(tokenId)

      expect(result).toBeDefined()
      expect(result.id).toBe(tokenId)
      expect(result.symbol).toBe("TEST")
    })

    it("should throw error for non-existent token", async () => {
      const tokenId = "non-existent"

      tokenRepository.findOne.mockResolvedValue(null)

      await expect(tokensController.getToken(tokenId)).rejects.toThrow(HttpException)
    })

    it("should add new token", async () => {
      const addTokenDto: AddTokenDto = {
        contractAddress: "0x1234567890123456789012345678901234567890",
        chainId: "1",
      }

      jest.spyOn(blockchainDataService, "syncTokenData").mockResolvedValue(mockToken)

      const result = await tokensController.addToken(addTokenDto)

      expect(result).toBeDefined()
      expect(result.contractAddress).toBe(addTokenDto.contractAddress)
    })
  })

  describe("AnalyticsController", () => {
    it("should get top performers", async () => {
      const queryDto = {
        chainId: "1",
        timeframe: "24h" as const,
        limit: 5,
      }

      const mockTopPerformers = [
        {
          tokenId: "token-1",
          symbol: "TEST",
          name: "Test Token",
          chainId: "1",
          currentPrice: "100.50",
          priceChange24h: "5.25",
          priceChangePercentage24h: "10.5",
          volume24h: "1000000.00",
          volumeChange24h: "15.30",
          marketCap: "80000000000.00",
          liquidity: "5000000.00",
          holderCount: 10000,
          holderChange24h: 100,
          transactionCount24h: 500,
          lastUpdated: new Date(),
        },
      ]

      jest.spyOn(tokenAnalyticsService, "getTopPerformers").mockResolvedValue(mockTopPerformers)

      const result = await analyticsController.getTopPerformers(queryDto)

      expect(result).toHaveLength(1)
      expect(Number.parseFloat(result[0].priceChangePercentage24h)).toBeGreaterThan(0)
    })

    it("should compare tokens", async () => {
      const compareDto = {
        tokenAId: "token-1",
        tokenBId: "token-2",
      }

      const mockComparison = {
        tokenA: {
          tokenId: "token-1",
          symbol: "TEST",
          name: "Test Token",
          chainId: "1",
          currentPrice: "100.50",
          priceChange24h: "5.25",
          priceChangePercentage24h: "5.5",
          volume24h: "1000000.00",
          volumeChange24h: "15.30",
          marketCap: "80000000000.00",
          liquidity: "5000000.00",
          holderCount: 10000,
          holderChange24h: 100,
          transactionCount24h: 500,
          lastUpdated: new Date(),
        },
        tokenB: {
          tokenId: "token-2",
          symbol: "TEST2",
          name: "Test Token 2",
          chainId: "1",
          currentPrice: "200.00",
          priceChange24h: "10.50",
          priceChangePercentage24h: "5.5",
          volume24h: "2000000.00",
          volumeChange24h: "25.60",
          marketCap: "160000000000.00",
          liquidity: "10000000.00",
          holderCount: 20000,
          holderChange24h: 200,
          transactionCount24h: 1000,
          lastUpdated: new Date(),
        },
        priceRatio: "0.5",
        volumeRatio: "0.5",
        marketCapRatio: "0.5",
        holderRatio: "0.5",
      }

      jest.spyOn(tokenAnalyticsService, "compareTokens").mockResolvedValue(mockComparison)

      const result = await analyticsController.compareTokens(compareDto)

      expect(result).toBeDefined()
      expect(result.tokenA.symbol).toBe("TEST")
      expect(result.tokenB.symbol).toBe("TEST2")
    })
  })

  describe("CrossChainController", () => {
    it("should compare cross-chain token", async () => {
      const compareDto: CrossChainComparisonDto = {
        symbol: "TEST",
      }

      const mockComparison = {
        symbol: "TEST",
        tokens: [
          {
            tokenId: "token-1",
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            price: "100.50",
            marketCap: "80000000000.00",
            volume24h: "1000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            priceChange24h: "5.5",
          },
        ],
        totalMarketCap: "80000000000.00",
        totalVolume24h: "1000000.00",
        totalLiquidity: "5000000.00",
        totalHolders: 10000,
        averagePrice: "100.50",
        priceSpread: {
          min: {
            tokenId: "token-1",
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            price: "100.50",
            marketCap: "80000000000.00",
            volume24h: "1000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            priceChange24h: "5.5",
          },
          max: {
            tokenId: "token-1",
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            price: "100.50",
            marketCap: "80000000000.00",
            volume24h: "1000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            priceChange24h: "5.5",
          },
          spreadPercentage: "0",
        },
        volumeDistribution: [
          {
            chainId: "1",
            chainName: "Ethereum",
            volume: "1000000.00",
            percentage: "100",
          },
        ],
      }

      jest.spyOn(crossChainAnalyticsService, "compareCrossChainToken").mockResolvedValue(mockComparison)

      const result = await crossChainController.compareToken(compareDto)

      expect(result).toBeDefined()
      expect(result.symbol).toBe("TEST")
      expect(result.tokens).toHaveLength(1)
    })

    it("should analyze cross-chain portfolio", async () => {
      const portfolioDto: CrossChainPortfolioDto = {
        tokenIds: ["token-1", "token-2"],
      }

      const mockPortfolio = {
        totalValue: "240000000000.00",
        chainDistribution: [
          {
            chainId: "1",
            chainName: "Ethereum",
            value: "240000000000.00",
            percentage: "100",
            tokenCount: 2,
          },
        ],
        topTokens: [
          {
            tokenId: "token-1",
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            price: "100.50",
            marketCap: "80000000000.00",
            volume24h: "1000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            priceChange24h: "5.5",
          },
        ],
        performanceMetrics: {
          totalReturn24h: "5.5",
          totalReturnPercentage24h: "5.5",
          bestPerformer: {
            tokenId: "token-1",
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            price: "100.50",
            marketCap: "80000000000.00",
            volume24h: "1000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            priceChange24h: "5.5",
          },
          worstPerformer: {
            tokenId: "token-1",
            symbol: "TEST",
            name: "Test Token",
            chainId: "1",
            chainName: "Ethereum",
            contractAddress: "0x1234567890123456789012345678901234567890",
            price: "100.50",
            marketCap: "80000000000.00",
            volume24h: "1000000.00",
            liquidity: "5000000.00",
            holderCount: 10000,
            priceChange24h: "5.5",
          },
        },
      }

      jest.spyOn(crossChainAnalyticsService, "getCrossChainPortfolio").mockResolvedValue(mockPortfolio)

      const result = await crossChainController.analyzePortfolio(portfolioDto)

      expect(result).toBeDefined()
      expect(result.chainDistribution).toHaveLength(1)
      expect(result.performanceMetrics).toBeDefined()
    })
  })

  describe("Integration Tests", () => {
    it("should handle complete token lifecycle", async () => {
      // 1. Add a new token
      const addTokenDto: AddTokenDto = {
        contractAddress: "0x1234567890123456789012345678901234567890",
        chainId: "1",
      }

      jest.spyOn(blockchainDataService, "syncTokenData").mockResolvedValue(mockToken)
      tokenRepository.findOne.mockResolvedValue(mockToken)

      const addedToken = await tokensController.addToken(addTokenDto)
      expect(addedToken.symbol).toBe("TEST")

      // 2. Get token details
      const tokenDetails = await tokensController.getToken(addedToken.id)
      expect(tokenDetails.id).toBe(addedToken.id)

      // 3. Get token metrics
      jest.spyOn(tokenAnalyticsService, "getTokenMetrics").mockResolvedValue({
        tokenId: addedToken.id,
        symbol: "TEST",
        name: "Test Token",
        chainId: "1",
        currentPrice: "100.50",
        priceChange24h: "5.25",
        priceChangePercentage24h: "5.5",
        volume24h: "1000000.00",
        volumeChange24h: "15.30",
        marketCap: "80000000000.00",
        liquidity: "5000000.00",
        holderCount: 10000,
        holderChange24h: 100,
        transactionCount24h: 500,
        lastUpdated: new Date(),
      })

      const metrics = await tokensController.getTokenMetrics(addedToken.id)
      expect(metrics.currentPrice).toBe("100.50")

      // 4. Search for the token
      const searchResults = await tokensController.searchTokens({ query: "TEST" })
      expect(searchResults.length).toBeGreaterThan(0)
    })

    it("should handle error cases gracefully", async () => {
      // Test non-existent token
      tokenRepository.findOne.mockResolvedValue(null)

      await expect(tokensController.getToken("non-existent")).rejects.toThrow(HttpException)

      // Test invalid token comparison
      jest.spyOn(tokenAnalyticsService, "compareTokens").mockResolvedValue(null)

      await expect(analyticsController.compareTokens({ tokenAId: "invalid-1", tokenBId: "invalid-2" })).rejects.toThrow(
        HttpException,
      )

      // Test cross-chain comparison with no results
      jest.spyOn(crossChainAnalyticsService, "compareCrossChainToken").mockResolvedValue(null)

      await expect(crossChainController.compareToken({ symbol: "NONEXISTENT" })).rejects.toThrow(HttpException)
    })
  })

  describe("Performance Tests", () => {
    it("should handle large datasets efficiently", async () => {
      const largeTokenList = Array.from({ length: 1000 }, (_, i) => ({
        tokenId: `token-${i}`,
        symbol: `TEST${i}`,
        name: `Test Token ${i}`,
        chainId: "1",
        currentPrice: (100 + i).toString(),
        priceChange24h: (i % 10).toString(),
        priceChangePercentage24h: ((i % 10) / 100).toString(),
        volume24h: (1000000 + i * 1000).toString(),
        volumeChange24h: ((i % 20) / 100).toString(),
        marketCap: (80000000000 + i * 1000000).toString(),
        liquidity: (5000000 + i * 1000).toString(),
        holderCount: 10000 + i,
        holderChange24h: i % 100,
        transactionCount24h: 500 + i,
        lastUpdated: new Date(),
      }))

      jest.spyOn(tokenAnalyticsService, "getFilteredTokens").mockResolvedValue(largeTokenList)

      const startTime = Date.now()
      const result = await tokensController.searchTokens({ limit: 100 })
      const endTime = Date.now()

      expect(result).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it("should cache frequently accessed data", async () => {
      const tokenId = "token-1"
      const metrics = {
        tokenId,
        symbol: "TEST",
        name: "Test Token",
        chainId: "1",
        currentPrice: "100.50",
        priceChange24h: "5.25",
        priceChangePercentage24h: "5.5",
        volume24h: "1000000.00",
        volumeChange24h: "15.30",
        marketCap: "80000000000.00",
        liquidity: "5000000.00",
        holderCount: 10000,
        holderChange24h: 100,
        transactionCount24h: 500,
        lastUpdated: new Date(),
      }

      // First call should cache the data
      cacheService.cacheTokenMetrics(tokenId, metrics)

      // Second call should retrieve from cache
      const cachedMetrics = cacheService.getTokenMetrics(tokenId)

      expect(cachedMetrics).toEqual(metrics)
    })
  })
})
