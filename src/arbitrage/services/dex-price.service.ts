import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { DexPrice } from "../entities/dex-price.entity"

@Injectable()
export class DexPriceService {
  private readonly logger = new Logger(DexPriceService.name)
  private dexPriceRepository: Repository<DexPrice>

  // Mock data for demonstration
  private mockPrices = {
    "ETH/USDC": {
      ethereum: { uniswap_v3: 2000, sushiswap: 2001 },
      polygon: { quickswap: 1990, uniswap_v3: 1992 },
      arbitrum: { uniswap_v3: 2005, sushiswap: 2006 },
    },
    "WBTC/USDT": {
      ethereum: { uniswap_v3: 30000, sushiswap: 30010 },
      polygon: { quickswap: 29950, uniswap_v3: 29960 },
    },
    "DAI/USDC": {
      ethereum: { uniswap_v3: 1.001, sushiswap: 1.002 },
      polygon: { quickswap: 0.999, uniswap_v3: 0.998 },
    },
  }

  constructor(dexPriceRepository: Repository<DexPrice>) {
    this.dexPriceRepository = dexPriceRepository
  }

  async fetchAndStoreMockPrices(): Promise<DexPrice[]> {
    this.logger.log("Fetching and storing mock DEX prices...")
    const savedPrices: DexPrice[] = []

    for (const tokenPair in this.mockPrices) {
      const [tokenSymbol1, tokenSymbol2] = tokenPair.split("/")
      const chainsData = this.mockPrices[tokenPair]

      for (const chain in chainsData) {
        const dexesData = chainsData[chain]
        for (const dex in dexesData) {
          const price = dexesData[dex]

          // Store price for tokenSymbol1 (e.g., ETH) against a base (e.g., USDC)
          const newPriceEntry = this.dexPriceRepository.create({
            tokenSymbol: tokenSymbol1,
            chain,
            dex,
            price,
            timestamp: new Date(),
            liquidity: Math.random() * 1000000 + 100000, // Mock liquidity
          })
          savedPrices.push(await this.dexPriceRepository.save(newPriceEntry))

          // For simplicity, we assume the other token in the pair (e.g., USDC) has a price of 1 against itself
          // In a real scenario, you'd fetch prices for both tokens or use a common base.
          const newPriceEntry2 = this.dexPriceRepository.create({
            tokenSymbol: tokenSymbol2,
            chain,
            dex,
            price: 1, // Assuming stablecoin or base asset
            timestamp: new Date(),
            liquidity: Math.random() * 5000000 + 1000000,
          })
          savedPrices.push(await this.dexPriceRepository.save(newPriceEntry2))
        }
      }
    }
    this.logger.log(`Stored ${savedPrices.length} mock DEX prices.`)
    return savedPrices
  }

  async getLatestPrices(tokenSymbol?: string, chain?: string, dex?: string): Promise<DexPrice[]> {
    const queryBuilder = this.dexPriceRepository.createQueryBuilder("price")

    if (tokenSymbol) {
      queryBuilder.andWhere("price.tokenSymbol = :tokenSymbol", { tokenSymbol })
    }
    if (chain) {
      queryBuilder.andWhere("price.chain = :chain", { chain })
    }
    if (dex) {
      queryBuilder.andWhere("price.dex = :dex", { dex })
    }

    // Select only the latest price for each unique tokenSymbol, chain, dex combination
    queryBuilder
      .distinctOn(["price.tokenSymbol", "price.chain", "price.dex"])
      .orderBy("price.tokenSymbol", "ASC")
      .addOrderBy("price.chain", "ASC")
      .addOrderBy("price.dex", "ASC")
      .addOrderBy("price.timestamp", "DESC")

    return queryBuilder.getMany()
  }

  async getPriceHistory(tokenSymbol: string, chain: string, dex: string, limit = 100): Promise<DexPrice[]> {
    return this.dexPriceRepository.find({
      where: { tokenSymbol, chain, dex },
      order: { timestamp: "DESC" },
      take: limit,
    })
  }
}
