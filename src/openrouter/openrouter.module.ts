import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OpenRouterService } from './openrouter.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dialog } from '../entities/dialog.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    TypeOrmModule.forFeature([Dialog]),
  ],
  providers: [OpenRouterService],
  exports: [OpenRouterService],
})
export class OpenRouterModule {}