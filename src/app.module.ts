import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from './telegram/telegram.module';
import { OpenRouterModule } from './openrouter/openrouter.module';
import { AgentsModule } from './agents/agents.module';
import { User } from './entities/user.entity';
import { Dialog } from './entities/dialog.entity';
import { Agent } from './entities/agent.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'telegram_bot',
      entities: [User, Dialog, Agent],
      synchronize: true,
      logging: true,
    }),
    TelegramModule,
    OpenRouterModule,
    AgentsModule,
  ],
})
export class AppModule {}