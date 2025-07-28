import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Token } from "../entities/token.entity"
import type { CreateTokenDto, UpdateTokenDto } from "../dto/create-token.dto"

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)

  constructor(private tokenRepository: Repository<Token>) {}

  async create(createTokenDto: CreateTokenDto): Promise<Token> {
    const existingToken = await this.tokenRepository.findOne({ where: { symbol: createTokenDto.symbol.toUpperCase() } })
    if (existingToken) {
      this.logger.warn(`Token with symbol ${createTokenDto.symbol} already exists.`)
      return existingToken // Or throw a ConflictException
    }
    const token = this.tokenRepository.create({
      ...createTokenDto,
      symbol: createTokenDto.symbol.toUpperCase(),
    })
    this.logger.log(`Creating new token: ${token.symbol}`)
    return this.tokenRepository.save(token)
  }

  async findAll(): Promise<Token[]> {
    return this.tokenRepository.find()
  }

  async findOne(symbol: string): Promise<Token> {
    const token = await this.tokenRepository.findOne({ where: { symbol: symbol.toUpperCase() } })
    if (!token) {
      throw new NotFoundException(`Token with symbol ${symbol} not found`)
    }
    return token
  }

  async update(symbol: string, updateTokenDto: UpdateTokenDto): Promise<Token> {
    const token = await this.findOne(symbol)
    this.tokenRepository.merge(token, updateTokenDto)
    this.logger.log(`Updating token: ${token.symbol}`)
    return this.tokenRepository.save(token)
  }

  async remove(symbol: string): Promise<void> {
    const result = await this.tokenRepository.delete({ symbol: symbol.toUpperCase() })
    if (result.affected === 0) {
      throw new NotFoundException(`Token with symbol ${symbol} not found`)
    }
    this.logger.log(`Removed token: ${symbol}`)
  }
}
