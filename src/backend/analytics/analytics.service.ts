// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AnalyticsService {
  private redisClient = createClient();

  constructor(private httpService: HttpService) {
    this.redisClient.connect();
  }

  async fetchMarketData(token: string): Promise<any> {
    // Example: Fetch from Binance API
    const response = await this.httpService.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${token}USDT`).toPromise();
    const data = response.data;
    await this.redisClient.setEx(`market:${token}`, 3600, JSON.stringify(data));
    return data;
  }

  async fetchSentimentData(tokenOrNarrative: string): Promise<any> {
    // Placeholder: Replace with actual sentiment analysis API
    const sentiment = { tokenOrNarrative, sentiment: 'bullish', score: 0.75 };
    await this.redisClient.setEx(`sentiment:${tokenOrNarrative}`, 3600, JSON.stringify(sentiment));
    return sentiment;
  }

  startAnalyticsFeed(roomId: number, tokenOrNarrative: string) {
    interval(10000) // Update every 10 seconds
      .pipe(switchMap(() => this.fetchMarketData(tokenOrNarrative)))
      .subscribe((data) => {
        this.server.to(`room_${roomId}`).emit('analytics_update', data);
      });

    interval(30000) // Update sentiment every 30 seconds
      .pipe(switchMap(() => this.fetchSentimentData(tokenOrNarrative)))
      .subscribe((data) => {
        this.server.to(`room_${roomId}`).emit('sentiment_update', data);
      });
  }
}