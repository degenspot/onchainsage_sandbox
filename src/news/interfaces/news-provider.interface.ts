export interface NewsProvider {
    getName(): string;
    fetchLatestNews(limit?: number): Promise<RawNewsItem[]>;
    fetchNewsByKeyword(keyword: string, limit?: number): Promise<RawNewsItem[]>;
  }
  
  export interface RawNewsItem {
    title: string;
    content: string;
    url: string;
    author: string;
    publishedAt: Date;
    source: string;
  }
  
  export interface SentimentResult {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keywords: string[];
  }