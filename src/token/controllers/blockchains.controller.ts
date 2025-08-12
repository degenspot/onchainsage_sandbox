import { Controller, Get, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import type { BlockchainFactoryService } from "../services/blockchain/blockchain-factory.service"

export class BlockchainResponseDto {
  id: string
  name: string
  chainId: string
  type: string
  nativeCurrency: string
  rpcUrl?: string
  explorerUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

@ApiTags("Blockchains")
@Controller("api/blockchains")
export class BlockchainsController {
  private readonly logger = new Logger(BlockchainsController.name)

  constructor(private blockchainFactory: BlockchainFactoryService) {}

  @Get()
  @ApiOperation({ summary: "Get all supported blockchains" })
  @ApiResponse({ status: 200, description: "List of supported blockchains", type: [BlockchainResponseDto] })
  async getSupportedChains(): Promise<BlockchainResponseDto[]> {
    try {
      const chains = await this.blockchainFactory.getAllSupportedChains()

      return chains.map((chain) => ({
        id: chain.id,
        name: chain.name,
        chainId: chain.chainId,
        type: chain.type,
        nativeCurrency: chain.nativeCurrency,
        rpcUrl: chain.rpcUrl,
        explorerUrl: chain.explorerUrl,
        isActive: chain.isActive,
        createdAt: chain.createdAt,
        updatedAt: chain.updatedAt,
      }))
    } catch (error) {
      this.logger.error("Failed to get supported chains:", error)
      throw new HttpException("Failed to get supported chains", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
