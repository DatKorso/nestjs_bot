import { Controller, Post, Body, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    try {
      this.logger.debug(`Received webhook update: ${JSON.stringify(update)}`);
      
      if (!update) {
        this.logger.warn('Received empty update');
        return { status: 'error', message: 'Empty update received' };
      }

      if (update.message) {
        await this.telegramService.handleMessage(update);
        return { status: 'ok', message: 'Message processed successfully' };
      }

      this.logger.warn(`Unhandled update type: ${JSON.stringify(update)}`);
      return { status: 'ignored', message: 'Update type not handled' };
    } catch (error: unknown) {
      this.logger.error('Error processing webhook:', error instanceof Error ? error.stack : error);
      return { 
        status: 'error',
        message: `Failed to process update: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}