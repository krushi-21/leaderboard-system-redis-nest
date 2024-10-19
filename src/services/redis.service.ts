import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedisConnections();
  }

  private async initializeRedisConnections() {
    try {
      const redisConfig = this.configService.get('redis');
      this.logger.log('Initializing Redis connections...');
      this.logger.debug(`Redis config: ${JSON.stringify(redisConfig)}`);

      this.client = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);

      this.client.on('error', (err) => this.logger.error('Redis Client Error:', err));
      this.subscriber.on('error', (err) => this.logger.error('Redis Subscriber Error:', err));

      await Promise.all([
        this.waitForConnection(this.client, 'Client'),
        this.waitForConnection(this.subscriber, 'Subscriber'),
      ]);

      this.logger.log('Redis connections established successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis connections', error);
      this.client = null;
      this.subscriber = null;
    }
  }

  private async waitForConnection(connection: Redis, name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (connection.status === 'ready') {
        resolve();
      } else {
        connection.once('ready', resolve);
        connection.once('error', (err) =>
          reject(new Error(`${name} connection error: ${err.message}`)),
        );
      }
    });
  }

  async reconnect(): Promise<void> {
    this.logger.log('Attempting to reconnect to Redis...');
    await this.initializeRedisConnections();
    if (!this.client || !this.subscriber) {
      throw new Error('Failed to reconnect to Redis');
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
    this.subscriber?.disconnect();
  }

  async subscribe(
    channel: string,
    callback: (channel: string, message: string) => void,
  ): Promise<void> {
    if (!this.subscriber) {
      this.logger.warn('Redis subscriber is not initialized. Attempting to reconnect...');
      try {
        await this.reconnect();
      } catch (error) {
        this.logger.error('Failed to reconnect to Redis', error);
        throw new Error('Redis subscriber is not initialized and reconnection failed');
      }
    }

    if (this.subscriber.status !== 'ready') {
      this.logger.warn('Redis subscriber is not ready. Waiting for connection...');
      try {
        await this.waitForConnection(this.subscriber, 'Subscriber');
      } catch (error) {
        this.logger.error('Failed to connect Redis subscriber', error);
        throw new Error('Redis subscriber is not ready and connection failed');
      }
    }

    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', callback);
      this.logger.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel: ${channel}`, error);
      throw error;
    }
  }

  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  // Streams methods
  async addToStream(fields: Record<string, string>): Promise<string> {
    const entries = Object.entries(fields).flat();
    return this.client.xadd('scoreUpdates', '*', ...entries);
  }

  async readFromStream(streamName: string, count: any = 1, block: number = 0): Promise<any> {
    const result = await this.client.xread(
      'COUNT',
      count,
      'BLOCK',
      block,
      'STREAMS',
      streamName,
      '$',
    );
    return result ? result[0][1] : [];
  }

  async deleteFromStream(streamName: string, id: string): Promise<number> {
    return this.client.xdel(streamName, id);
  }

  // Leaderboard methods using Sorted Sets
  async updateScore(playerId: string, score: number): Promise<number> {
    const result = await this.client.zadd('leaderboard', score, playerId);
    await this.client.zremrangebyrank('leaderboard', 0, -101); // Keep only the top 100 scores
    return result;
  }

  async getPlayerRank(playerId: string): Promise<number | null> {
    const rank = await this.client.zrevrank('leaderboard', playerId);
    return rank !== null ? rank + 1 : null;
  }

  async getPlayerScore(playerId: string): Promise<number | string | null> {
    return this.client.zscore('leaderboard', playerId);
  }

  async getTopPlayers(count: number = 10): Promise<Array<{ playerId: string; score: number }>> {
    const results = await this.client.zrevrange('leaderboard', 0, count - 1, 'WITHSCORES');
    return this.parseLeaderboardResults(results);
  }

  async getPlayerRange(
    leaderboardName: string,
    start: number,
    end: number,
  ): Promise<Array<{ playerId: string; score: number }>> {
    const results = await this.client.zrevrange(leaderboardName, start, end, 'WITHSCORES');
    return this.parseLeaderboardResults(results);
  }

  async getLatestPlayers(count: number = 100): Promise<Array<{ playerId: string; score: number }>> {
    const results = await this.client.zrevrange('leaderboard', 0, count - 1, 'WITHSCORES');
    return this.parseLeaderboardResults(results);
  }

  private parseLeaderboardResults(results: string[]): Array<{ playerId: string; score: number }> {
    const players = [];
    for (let i = 0; i < results.length; i += 2) {
      players.push({
        playerId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }
    return players;
  }
}
