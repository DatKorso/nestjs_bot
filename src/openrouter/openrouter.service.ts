import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dialog } from '../entities/dialog.entity';
import { AxiosError } from 'axios';

@Injectable()
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Dialog)
    private readonly dialogRepository: Repository<Dialog>,
  ) {
    const key = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!key) {
      throw new Error('OPENROUTER_API_KEY is not defined in .env');
    }
    this.apiKey = key;
    
    const baseUrl = this.configService.get<string>('OPENROUTER_BASE_URL');
    this.apiUrl = baseUrl || 'https://openrouter.ai/api/v1';
  }

  private async clearUserContext(userId: number): Promise<void> {
    try {
      await this.dialogRepository.delete({ user: { id: userId } });
      this.logger.debug(`Context cleared for user ${userId}`);
    } catch (error: unknown) {
      this.logger.error(`Error clearing context for user ${userId}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async generateResponse(userId: number, message: string) {
    try {
      // Обработка команд
      if (message === '/start') {
        return 'Привет! Я бот с искусственным интеллектом. Чем могу помочь?';
      }
      
      if (message === '/new') {
        await this.clearUserContext(userId);
        return 'Контекст очищен. Начинаем новый диалог!';
      }

      // Get last 5 messages for context
      const context = await this.dialogRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 5,
      });

      this.logger.debug('Retrieved context messages:', context);

      // Преобразуем предыдущие сообщения в формат для API
      const messages = context.reverse().map(dialog => ({
        role: dialog.isAssistant ? 'assistant' : 'user',
        content: dialog.message,
      }));

      // Добавляем текущее сообщение пользователя
      messages.push({ role: 'user', content: message });

      this.logger.debug('Sending messages to OpenRouter:', messages);

      const response = await this.sendToOpenRouter(messages);
      
      if (!response?.choices?.[0]?.message?.content) {
        this.logger.error('Invalid response from OpenRouter:', response);
        throw new Error('Invalid response format from OpenRouter');
      }

      return response.choices[0].message.content;
    } catch (error: unknown) {
      this.logger.error('Error generating response:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async sendToOpenRouter(messages: any[]) {
    const url = `${this.apiUrl}/chat/completions`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/OpenRouterTeam/openrouter',
      'X-Title': 'Telegram Bot'
    };

    const data = {
      model: 'mistralai/mistral-small-24b-instruct-2501',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    };

    try {
      this.logger.debug('Sending request to OpenRouter:', { url, messages: messages.length });
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );
      this.logger.debug('Received response from OpenRouter:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        this.logger.error('OpenRouter API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        this.logger.error('Error calling OpenRouter API:', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }
}