import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RedisService } from './services/redis.service';
import { ChatGateway } from './chat.gateway';
import { DatabaseService } from './services/database.service';
import { GameService } from './services/game.service';
import { DatabaseWorkerService } from './services/database-worker.service';
import { Player } from './models/player.model';
import { Score } from './models/score.model';
import redisConfig from './config/redis.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [redisConfig, databaseConfig],
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadModels: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([Player, Score]),
  ],
  providers: [RedisService, ChatGateway, DatabaseService, GameService, DatabaseWorkerService],
})
export class AppModule {}
