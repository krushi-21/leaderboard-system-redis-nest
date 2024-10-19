import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class GameService {
  constructor(private redisService: RedisService) {}

  async updatePlayerScore(playerId: string, score: number): Promise<void> {
    // Update Redis leaderboard
    await this.redisService.updateScore(playerId, score);

    // Add score update to Redis Stream
    await this.redisService.addToStream({
      playerId,
      score: score.toString(),
    });

    // Publish score update event for real-time notifications
    await this.redisService.publish('scoreUpdates', JSON.stringify({ playerId, score }));
  }

  async getTopPlayers(count: number = 10): Promise<Array<{ playerId: string; score: number }>> {
    return this.redisService.getTopPlayers(count);
  }

  async getPlayerRank(playerId: string): Promise<number | null> {
    return this.redisService.getPlayerRank(playerId);
  }

  async getPlayerScore(playerId: string): Promise<number | string | null> {
    return this.redisService.getPlayerScore(playerId);
  }

  async getLatestPlayers(count: number = 100): Promise<Array<{ playerId: string; score: number }>> {
    return this.redisService.getLatestPlayers(count);
  }
}
