import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../ai/services/openai.service';
import { SentimentResult } from '../interfaces/sentiment-result.interface';

@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);

  constructor(private readonly openaiService: OpenAIService) {}

  async analyzeSentiment(content: string): Promise<SentimentResult> {
    try {
      const prompt = this.buildSentimentPrompt(content);
      const response = await this.openaiService.generateCompletion(prompt);
      
      return this.parseSentimentResponse(response);
    } catch (error) {
      this.logger.error(`Sentiment analysis failed: ${error.message}`);
      return this.getDefaultSentiment();
    }
  }

  private buildSentimentPrompt(content: string): string {
    return `
      Analyze the sentiment of this crypto news article and return a JSON response:
      
      Article: "${content}"
      
      Return ONLY a JSON object with this exact structure:
      {
        "score": <number between -1 and 1>,
        "label": "<positive|negative|neutral>",
        "confidence": <number between 0 and 1>,
        "keywords": ["<key1>", "<key2>", ...]
      }
      
      Score: -1 (very negative) to 1 (very positive)
      Label: positive (>0.1), negative (<-0.1), neutral (-0.1 to 0.1)
      Keywords: Extract 3-5 most important words related to sentiment
    `;
  }

  private parseSentimentResponse(response: string): SentimentResult {
    try {
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        score: Math.max(-1, Math.min(1, parsed.score || 0)),
        label: this.validateLabel(parsed.label),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : []
      };
    } catch (error) {
      this.logger.error(`Failed to parse sentiment response: ${error.message}`);
      return this.getDefaultSentiment();
    }
  }

  private validateLabel(label: string): 'positive' | 'negative' | 'neutral' {
    const validLabels = ['positive', 'negative', 'neutral'];
    return validLabels.includes(label) ? label as any : 'neutral';
  }

  private getDefaultSentiment(): SentimentResult {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0.5,
      keywords: []
    };
  }
}