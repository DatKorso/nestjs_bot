import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Dialog } from '../entities/dialog.entity';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { AxiosError } from 'axios';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly apiUrl: string;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Dialog)
    private readonly dialogRepository: Repository<Dialog>,
    private readonly openRouterService: OpenRouterService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env');
    }
    this.botToken = token;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    // Initialize webhook
    this.setWebhook().catch(error => {
      this.logger.error('Failed to set webhook:', error.message);
      throw error;
    });
  }

  private async setWebhook() {
    const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('TELEGRAM_WEBHOOK_URL is not defined in .env');
    }

    this.logger.log(`Setting webhook URL to: ${webhookUrl}`);
    const url = `${this.apiUrl}/setWebhook`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          url: webhookUrl,
          allowed_updates: ['message'],
        }),
      );

      if (!response.data?.ok) {
        throw new Error('Failed to set webhook: ' + JSON.stringify(response.data));
      }

      this.logger.log('Telegram webhook set successfully. Response:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        this.logger.error('Error setting webhook:', error.response?.data || error.message);
      } else {
        this.logger.error('Error setting webhook:', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  async handleMessage(update: any) {
    this.logger.debug('Processing message update:', update);
    const { message } = update;
    const { from, text } = message;

    try {
      // Find or create user
      let user = await this.userRepository.findOne({
        where: { telegramId: from.id },
      });

      if (!user) {
        this.logger.debug('Creating new user:', from);
        user = this.userRepository.create({
          telegramId: from.id,
          firstName: from.first_name,
          lastName: from.last_name,
          username: from.username,
        });
        await this.userRepository.save(user);
      }

      // Get AI response first (before saving the message)
      this.logger.debug('Requesting AI response for user:', user.id);
      const aiResponse = await this.openRouterService.generateResponse(user.id, text);

      // Save user message
      this.logger.debug('Saving user message:', text);
      const userDialog = this.dialogRepository.create({
        message: text,
        user,
        isAssistant: false
      });
      await this.dialogRepository.save(userDialog);

      // Save AI response
      this.logger.debug('Saving AI response:', aiResponse);
      const aiDialog = this.dialogRepository.create({
        message: aiResponse,
        user,
        isAssistant: true
      });
      await this.dialogRepository.save(aiDialog);

      this.logger.debug('Sending response back to user:', from.id);
      return this.sendMessage(from.id, aiResponse);
    } catch (error: unknown) {
      this.logger.error('Error in handleMessage:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async sendMessage(chatId: number, text: string) {
    const url = `${this.apiUrl}/sendMessage`;
    const params = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };

    try {
      this.logger.debug('Sending message to Telegram:', { chatId, textLength: text.length });
      const response = await firstValueFrom(
        this.httpService.post(url, params),
      );
      this.logger.debug('Message sent successfully');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        this.logger.error('Error sending message:', error.response?.data || error.message);
      } else {
        this.logger.error('Error sending message:', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }
}