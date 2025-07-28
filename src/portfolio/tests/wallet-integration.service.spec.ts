import { Test, type TestingModule } from "@nestjs/testing"
import { WalletIntegrationService } from "../services/wallet-integration.service"
import { jest } from "@jest/globals"

describe("WalletIntegrationService", () => {
  let service: WalletIntegrationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletIntegrationService],
    }).compile()

    service = module.get<WalletIntegrationService>(WalletIntegrationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchWalletAssets", () => {
    it("should return mock assets for a known wallet address", async () => {
      const walletAddress = "0xMockUserWallet1"
      const assets = await service.fetchWalletAssets(walletAddress)

      expect(assets).toHaveLength(3)
      expect(assets[0]).toHaveProperty("symbol", "ETH")
      expect(assets[1]).toHaveProperty("symbol", "BTC")
      expect(assets[2]).toHaveProperty("symbol", "USDC")
    })

    it("should return different mock assets for another known wallet address", async () => {
      const walletAddress = "0xMockUserWallet2"
      const assets = await service.fetchWalletAssets(walletAddress)

      expect(assets).toHaveLength(2)
      expect(assets[0]).toHaveProperty("symbol", "SOL")
      expect(assets[1]).toHaveProperty("symbol", "ADA")
    })

    it("should return an empty array for an unknown wallet address", async () => {
      const walletAddress = "0xUnknownWallet"
      const assets = await service.fetchWalletAssets(walletAddress)

      expect(assets).toHaveLength(0)
    })
  })

  describe("executeRebalance", () => {
    it("should simulate successful rebalance execution", async () => {
      const walletAddress = "0xMockUserWallet1"
      const actions = { type: "buy" as const, symbol: "ETH", amountUSD: 500 }

      const result = await service.executeRebalance(walletAddress, actions)

      expect(result).toBe(true)
    })

    it("should simulate successful rebalance execution for sell action", async () => {
      const walletAddress = "0xMockUserWallet1"
      const actions = { type: "sell" as const, symbol: "BTC", amountUSD: 1000 }

      const result = await service.executeRebalance(walletAddress, actions)

      expect(result).toBe(true)
    })
  })
})
