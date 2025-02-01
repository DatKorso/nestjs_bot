import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Dialog } from './src/entities/dialog.entity';
import { User } from './src/entities/user.entity';
import { Agent } from './src/entities/agent.entity';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [Dialog, User, Agent],
  migrations: ['migrations/*.ts'],
  synchronize: false,
}); 