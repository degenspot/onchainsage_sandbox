import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { Repository } from "typeorm"
import type { Blockchain } from "../../entities/blockchain.entity"
import type { IBlockchainService } from "../../interfaces/blockchain-service.interface"
import { EvmBlockchainService } from "./evm-blockchain.service"
import { SolanaBlockchainService } from "./solana-blockchain.service"

@Injectable()
export class BlockchainFactoryService {
  private readonly logger = new Logger(BlockchainFactoryService.name)
  private serviceCache = new Map<string, IBlockchainService>()

  constructor(
    private configService: ConfigService,
    private blockchainRepository: Repository<Blockchain>,
  ) {}

  async getBlockchainService(chainId: string): Promise<IBlockchainService> {
    // Check cache first
    if (this.serviceCache.has(chainId)) {
      return this.serviceCache.get(chainId)
    }

    // Fetch blockchain config from database
    const blockchain = await this.blockchainRepository.findOne({
      where: { chainId, isActive: true },
    })

    if (!blockchain) {
      throw new Error(`Blockchain with chainId ${chainId} not found or inactive`)
    }

    let service: IBlockchainService

    switch (blockchain.type.toLowerCase()) {
      case "evm":
        service = new EvmBlockchainService(this.configService, blockchain.rpcUrl, blockchain.chainId)
        break
      case "solana":
        service = new SolanaBlockchainService(this.configService, blockchain.rpcUrl)
        break
      default:
        throw new Error(`Unsupported blockchain type: ${blockchain.type}`)
    }

    // Cache the service
    this.serviceCache.set(chainId, service)

    return service
  }

  async getAllSupportedChains(): Promise<Blockchain[]> {
    return this.blockchainRepository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    })
  }

  clearCache(): void {
    this.serviceCache.clear()
  }
}
