import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { DatabaseService } from './database.service';

@Injectable()
export class DatabaseWorkerService implements OnModuleInit {
  private isProcessing: boolean = false;

  constructor(
    private redisService: RedisService,
    private databaseService: DatabaseService,
  ) {}

  onModuleInit() {
    this.startProcessing();
  }

  private async startProcessing() {
    while (true) {
      if (!this.isProcessing) {
        this.isProcessing = true;
        await this.processScoreUpdates();
        this.isProcessing = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async processScoreUpdates() {
    const updates = await this.redisService.readFromStream('scoreUpdates', 10, 5000);
    for (const [id, fields] of updates) {
      const playerId = fields.find((f) => f[0] === 'playerId')[1];
      const score = parseFloat(fields.find((f) => f[0] === 'score')[1]);

      try {
        await this.databaseService.createScore(parseInt(playerId, 10), score);
        await this.redisService.deleteFromStream('scoreUpdates', id);
      } catch (error) {
        console.error('Error processing score update:', error);
      }
    }
  }
}
