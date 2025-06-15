import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DiscordGuildData, DiscordChannelData } from '../interfaces/community-data.interface';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly baseUrl = 'https://discord.com/api/v10';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getHeaders() {
    return {
      Authorization: `Bot ${this.configService.get('DISCORD_BOT_TOKEN')}`,
      'Content-Type': 'application/json',
    };
  }

  async getGuildData(guildId: string): Promise<DiscordGuildData> {
    try {
      const guildResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/guilds/${guildId}?with_counts=true`, {
          headers: this.getHeaders(),
        }),
      );

      const channelsResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/guilds/${guildId}/channels`, {
          headers: this.getHeaders(),
        }),
      );

      const rolesResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/guilds/${guildId}/roles`, {
          headers: this.getHeaders(),
        }),
      );

      return {
        id: guildResponse.data.id,
        name: guildResponse.data.name,
        memberCount: guildResponse.data.approximate_member_count,
        channels: channelsResponse.data.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
        })),
        roles: rolesResponse.data.map((role: any) => ({
          id: role.id,
          name: role.name,
          memberCount: 0, // Would need additional API calls to get accurate count
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Discord guild data: ${error.message}`);
      throw error;
    }
  }

  async getChannelMessages(channelId: string, limit = 100): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/channels/${channelId}/messages?limit=${limit}`, {
          headers: this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch channel messages: ${error.message}`);
      return [];
    }
  }

  async getActiveMembers(guildId: string, days = 7): Promise<Set<string>> {
    const activeMembers = new Set<string>();
    
    try {
      const guild = await this.getGuildData(guildId);
      
      for (const channel of guild.channels) {
        if (channel.type === 0) { // Text channel
          const messages = await this.getChannelMessages(channel.id, 100);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          
          messages
            .filter(msg => new Date(msg.timestamp) > cutoffDate)
            .forEach(msg => activeMembers.add(msg.author.id));
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get active members: ${error.message}`);
    }

    return activeMembers;
  }
}
