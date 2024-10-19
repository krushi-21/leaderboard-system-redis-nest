import { Controller, Get, Post, Body } from '@nestjs/common';
import { RedisService } from './services/redis.service';

@Controller()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Post('publish')
  async publish(@Body() body: { channel: string; message: string }) {
    const { channel, message } = body;
    await this.redisService.publish(channel, message);
    return { success: true };
  }

  @Post('subscribe')
  async subscribe(@Body() body: { channel: string }) {
    const { channel } = body;
    this.redisService.subscribe(channel, (message) => {
      console.log(`Received message on channel ${channel}:`, message);
    });
    return { success: true };
  }

  @Post('stream')
  async addToStream(@Body() body: { streamName: string; data: Record<string, string> }) {
    const { data } = body;
    const result = await this.redisService.addToStream(data);
    return { success: true, id: result };
  }

  @Get('stream')
  async readFromStream(@Body() body: { streamName: string; lastId?: string; count?: number }) {
    const { streamName, lastId = '$', count = 10 } = body;
    const result = await this.redisService.readFromStream(streamName, lastId, count);
    return { success: true, data: result };
  }
}
