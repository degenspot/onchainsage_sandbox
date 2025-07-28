import { Injectable } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ProposalDiscussion } from "../entities/proposal-discussion.entity"
import type { SentimentAnalysisDto } from "../dto/governance-analytics.dto"

@Injectable()
export class SentimentAnalysisService {
  private discussionRepository: Repository<ProposalDiscussion>

  constructor(discussionRepository: Repository<ProposalDiscussion>) {
    this.discussionRepository = discussionRepository
  }

  async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis - in production, you'd use a proper NLP service
    const positiveWords = ["good", "great", "excellent", "support", "agree", "positive", "beneficial", "approve"]
    const negativeWords = ["bad", "terrible", "oppose", "disagree", "negative", "harmful", "reject", "against"]

    const words = text.toLowerCase().split(/\s+/)
    let score = 0

    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 1
      if (negativeWords.includes(word)) score -= 1
    })

    // Normalize to -1 to 1 scale
    const maxWords = Math.max(positiveWords.length, negativeWords.length)
    return Math.max(-1, Math.min(1, score / maxWords))
  }

  async analyzeProposalSentiment(proposalId: string): Promise<SentimentAnalysisDto> {
    const discussions = await this.discussionRepository.find({
      where: { proposalId },
      order: { timestamp: "ASC" },
    })

    if (discussions.length === 0) {
      return {
        proposalId,
        overallSentiment: 0,
        positiveComments: 0,
        negativeComments: 0,
        neutralComments: 0,
        sentimentTrend: [],
      }
    }

    // Analyze sentiment for each discussion if not already done
    for (const discussion of discussions) {
      if (discussion.sentimentScore === null) {
        discussion.sentimentScore = await this.analyzeSentiment(discussion.content)
        await this.discussionRepository.save(discussion)
      }
    }

    const sentiments = discussions.map((d) => d.sentimentScore).filter((s) => s !== null)
    const overallSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length

    const positiveComments = sentiments.filter((s) => s > 0.1).length
    const negativeComments = sentiments.filter((s) => s < -0.1).length
    const neutralComments = sentiments.filter((s) => s >= -0.1 && s <= 0.1).length

    // Create sentiment trend (daily averages)
    const sentimentTrend = this.createSentimentTrend(discussions)

    return {
      proposalId,
      overallSentiment,
      positiveComments,
      negativeComments,
      neutralComments,
      sentimentTrend,
    }
  }

  private createSentimentTrend(discussions: ProposalDiscussion[]): Array<{ date: string; sentiment: number }> {
    const dailyGroups = new Map<string, number[]>()

    discussions.forEach((discussion) => {
      if (discussion.sentimentScore !== null) {
        const date = discussion.timestamp.toISOString().split("T")[0]
        if (!dailyGroups.has(date)) {
          dailyGroups.set(date, [])
        }
        dailyGroups.get(date)!.push(discussion.sentimentScore)
      }
    })

    return Array.from(dailyGroups.entries())
      .map(([date, sentiments]) => ({
        date,
        sentiment: sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async createDiscussion(
    proposalId: string,
    author: string,
    content: string,
    platform?: string,
  ): Promise<ProposalDiscussion> {
    const sentimentScore = await this.analyzeSentiment(content)

    const discussion = this.discussionRepository.create({
      proposalId,
      author,
      content,
      platform,
      sentimentScore,
      timestamp: new Date(),
    })

    return this.discussionRepository.save(discussion)
  }

  async getDiscussionsByProposal(proposalId: string): Promise<ProposalDiscussion[]> {
    return this.discussionRepository.find({
      where: { proposalId },
      order: { timestamp: "DESC" },
    })
  }
}
