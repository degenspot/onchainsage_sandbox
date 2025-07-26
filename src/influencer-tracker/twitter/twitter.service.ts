import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TwitterApi } from 'twitter-api-v2';
import { InfluencersService } from '../influencers/influencers.service';
import { TokensService } from '../tokens/tokens.service';
import { MentionsService } from '../mentions/mentions.service';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);
  private twitterClient: TwitterApi;

  constructor(
    private configService: ConfigService,
    private influencersService: InfluencersService,
    private tokensService: TokensService,
    private mentionsService: MentionsService,
  ) {
    this.twitterClient = new TwitterApi({
      appKey: this.configService.get('TWITTER_API_KEY'),
      appSecret: this.configService.get('TWITTER_API_SECRET'),
      accessToken: this.configService.get('TWITTER_ACCESS_TOKEN'),
      accessSecret: this.configService.get('TWITTER_ACCESS_SECRET'),
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scanInfluencerTweets() {
    this.logger.log('Starting influencer tweet scan...');
    
    try {
      const influencers = await this.influencersService.getActiveInfluencers();
      
      for (const influencer of influencers) {
        await this.scanUserTweets(influencer);
        await this.sleep(1000); // Rate limiting
      }
    } catch (error) {
      this.logger.error('Error scanning influencer tweets:', error);
    }
  }

  private async scanUserTweets(influencer: any) {
    try {
      const tweets = await this.twitterClient.v2.userTimeline(influencer.twitterId, {
        max_results: 10,
        'tweet.fields': ['public_metrics', 'created_at'],
      });

      for (const tweet of tweets.data || []) {
        await this.processTweet(tweet, influencer);
      }
    } catch (error) {
      this.logger.error(`Error scanning tweets for ${influencer.twitterHandle}:`, error);
    }
  }

  private async processTweet(tweet: any, influencer: any) {
    // Check if tweet mentions any tracked tokens
    const mentionedTokens = await this.tokensService.searchByKeywords(tweet.text);
    
    for (const token of mentionedTokens) {
      // Check if mention already exists
      const existingMention = await this.mentionsService.findByTweetId(tweet.id);
      
      if (!existingMention) {
        await this.mentionsService.create({
          tweetId: tweet.id,
          content: tweet.text,
          url: `https://twitter.com/${influencer.twitterHandle}/status/${tweet.id}`,
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
          influencerId: influencer.id,
          tokenId: token.id,
          sentiment: this.analyzeSentiment(tweet.text),
          sentimentScore: this.calculateSentimentScore(tweet.text),
        });

        this.logger.log(`New mention found: ${influencer.twitterHandle} mentioned ${token.symbol}`);
      }
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bullish', 'moon', 'buy', 'pump', 'rocket', 'gem', 'hodl', 'diamond', 'hands'];
    const negativeWords = ['bearish', 'dump', 'sell', 'crash', 'rug', 'scam', 'dead', 'rip'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateSentimentScore(text: string): number {
    // Simple sentiment scoring based on keywords
    const positiveWords = ['bullish', 'moon', 'buy', 'pump', 'rocket', 'gem', 'hodl'];
    const negativeWords = ['bearish', 'dump', 'sell', 'crash', 'rug', 'scam'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });
    
    return Math.max(-5, Math.min(5, score));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}