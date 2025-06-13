import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';
import { TokenMetrics } from '../entities/token-metrics.entity';
import { TokenCategory } from '../enums/lifecycle-stage.enum';

@Injectable()
export class AutomatedCategorizationService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenMetrics)
    private metricsRepository: Repository<TokenMetrics>
  ) {}

  async categorizeToken(tokenId: string): Promise<TokenCategory> {
    const token = await this.tokenRepository.findOne({ where: { id: tokenId } });
    if (!token) throw new Error('Token not found');

    const metrics = await this.metricsRepository.find({
      where: { tokenId },
      order: { timestamp: 'DESC' },
      take: 10
    });

    // Analyze token characteristics
    const features = this.extractCategorizationFeatures(token, metrics);
    const category = this.classifyToken(features);
    
    // Update token category if different
    if (category !== token.category) {
      await this.tokenRepository.update(tokenId, { category });
    }

    return category;
  }

  private extractCategorizationFeatures(token: Token, metrics: TokenMetrics[]): Record<string, any> {
    const latest = metrics[0];
    
    return {
      name: token.name.toLowerCase(),
      symbol: token.symbol.toLowerCase(),
      blockchain: token.blockchain.toLowerCase(),
      totalSupply: token.totalSupply,
      avgVolatility: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.volatility, 0) / metrics.length : 0,
      avgSocialMentions: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.socialMentions, 0) / metrics.length : 0,
      githubActivity: latest ? latest.githubActivity : 0,
      liquidityScore: latest ? latest.liquidityScore : 0,
      metadata: token.metadata || {}
    };
  }

  private classifyToken(features: Record<string, any>): TokenCategory {
    // Rule-based classification - could be replaced with ML model
    const name = features.name || '';
    const symbol = features.symbol || '';
    
    // Gaming tokens
    if (name.includes('game') || name.includes('play') || name.includes('nft') && features.githubActivity > 10) {
      return TokenCategory.GAMING;
    }
    
    // DeFi tokens
    if (name.includes('swap') || name.includes('defi') || name.includes('yield') || 
        name.includes('liquidity') || features.liquidityScore > 80) {
      return TokenCategory.DEFI;
    }
    
    // NFT tokens
    if (name.includes('nft') || name.includes('collectible') || name.includes('art')) {
      return TokenCategory.NFT;
    }
    
    // Governance tokens
    if (name.includes('governance') || name.includes('dao') || name.includes('vote')) {
      return TokenCategory.GOVERNANCE;
    }
    
    // Infrastructure tokens
    if (name.includes('network') || name.includes('protocol') || name.includes('layer') ||
        features.githubActivity > 50) {
      return TokenCategory.INFRASTRUCTURE;
    }
    
    // Meme tokens (high social mentions, high volatility)
    if (features.avgSocialMentions > 1000 && features.avgVolatility > 100) {
      return TokenCategory.MEME;
    }
    
    // Default to utility
    return TokenCategory.UTILITY;
  }

  async batchCategorizeTokens(): Promise<{ updated: number; errors: string[] }> {
    const tokens = await this.tokenRepository.find();
    let updated = 0;
    const errors: string[] = [];

    for (const token of tokens) {
      try {
        await this.categorizeToken(token.id);
        updated++;
      } catch (error) {
        errors.push(`Failed to categorize token ${token.symbol}: ${error.message}`);
      }
    }

    return { updated, errors };
  }
}