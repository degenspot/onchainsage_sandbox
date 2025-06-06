import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { NaturalLanguageService } from '../../shared/services/nlp.service';
import { Narrative } from '../models/narrative.model';

@Injectable()
export class ExtractionService {
  constructor(
    private httpService: HttpService,
    private nlpService: NaturalLanguageService,
  ) {}

  async detectNarrativesFromSocial(socialData: any[]): Promise<string[]> {
    // Aggregate and process text data
    const allText = socialData.map(post => post.content).join(' ');
    
    // Extract keywords and topics
    const { keywords, topics } = await this.nlpService.analyzeText(allText);
    
    // Cluster similar topics to identify narratives
    return this.clusterTopics(topics);
  }

  private clusterTopics(topics: string[]): string[] {
    // Implement topic clustering algorithm
    // This could use NLP embeddings and similarity scoring
    // Simplified version:
    const uniqueTopics = [...new Set(topics)];
    return uniqueTopics.filter(topic => 
      topic.split(' ').length <= 3 && // Simple phrases only
      !this.isCommonTerm(topic) // Filter out common terms
    );
  }

  private isCommonTerm(term: string): boolean {
    const commonTerms = ['crypto', 'blockchain', 'bitcoin', 'ethereum'];
    return commonTerms.includes(term.toLowerCase());
  }

  async updateNarrativeKeywords(narrative: Narrative, socialData: any[]): Promise<string[]> {
    const newKeywords = await this.nlpService.extractKeywords(
      socialData.map(post => post.content)
    );
    return [...new Set([...narrative.keywords, ...newKeywords])];
  }
}