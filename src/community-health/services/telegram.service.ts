import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TelegramChatData } from '../interfaces/community-data.interface';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly baseUrl = 'https://api.telegram.org/bot';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getUrl(method: string): string {
    return `${this.baseUrl}${this.configService.get('TELEGRAM_BOT_TOKEN')}/${method}`;
  }

  async getChatData(chatId: string): Promise<TelegramChatData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.getUrl(`getChat?chat_id=${chatId}`)),
      );

      const chat = response.data.result;
      
      let memberCount = 0;
      try {
        const memberCountResponse = await firstValueFrom(
          this.httpService.get(this.getUrl(`getChatMemberCount?chat_id=${chatId}`)),
        );
        memberCount = memberCountResponse.data.result;
      } catch (error) {
        this.logger.warn(`Could not get member count for chat ${chatId}`);
      }

      return {
        id: chat.id,
        title: chat.title,
        type: chat.type,
        memberCount,
        description: chat.description,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Telegram chat data: ${error.message}`);
      throw error;
    }
  }

  async getChatAdministrators(chatId: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.getUrl(`getChatAdministrators?chat_id=${chatId}`)),
      );
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get chat administrators: ${error.message}`);
      return [];
    }
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(this.getUrl('sendMessage'), {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`);
    }
  }
}