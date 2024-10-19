import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from './services/redis.service';
import { GameService } from './services/game.service';
import { DatabaseService } from './services/database.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly gameService: GameService,
    private readonly databaseService: DatabaseService,
  ) {}

  afterInit() {
    this.subscribeToScoreUpdates();
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  private async subscribeToScoreUpdates() {
    await this.redisService.subscribe('scoreUpdates', (channel, message) => {
      const scoreUpdate = JSON.parse(message);
      this.server.emit('scoreUpdate', scoreUpdate);
    });
  }

  @SubscribeMessage('updateScore')
  async handleUpdateScore(
    client: Socket,
    payload: { playerId: string; score: number },
  ): Promise<void> {
    await this.gameService.updatePlayerScore(payload.playerId, payload.score);

    // Emit the score update to all connected clients
    this.server.emit('scoreUpdate', { playerId: payload.playerId, score: payload.score });
  }

  @SubscribeMessage('getTopPlayers')
  async handleGetTopPlayers(client: Socket, payload: { count?: number }): Promise<void> {
    const topPlayers = await this.gameService.getTopPlayers(payload.count);
    client.emit('topPlayers', { players: topPlayers });
  }

  @SubscribeMessage('getPlayerRank')
  async handleGetPlayerRank(client: Socket, payload: { playerId: string }): Promise<void> {
    const rank = await this.gameService.getPlayerRank(payload.playerId);
    client.emit('playerRank', { playerId: payload.playerId, rank });
  }

  @SubscribeMessage('getPlayerScore')
  async handleGetPlayerScore(client: Socket, payload: { playerId: string }): Promise<void> {
    const score = await this.gameService.getPlayerScore(payload.playerId);
    client.emit('playerScore', { playerId: payload.playerId, score });
  }

  @SubscribeMessage('createPlayer')
  async handleCreatePlayer(
    client: Socket,
    payload: { username: string; email: string },
  ): Promise<void> {
    const player = await this.databaseService.createPlayer(payload.username, payload.email);
    client.emit('playerCreated', player);
  }

  @SubscribeMessage('getPlayer')
  async handleGetPlayer(client: Socket, payload: { id: number }): Promise<void> {
    const player = await this.databaseService.getPlayerById(payload.id);
    client.emit('playerData', player);
  }

  @SubscribeMessage('getLatestPlayers')
  async handleGetLatestPlayers(client: Socket, payload: { count?: number }): Promise<void> {
    const latestPlayers = await this.gameService.getLatestPlayers(payload.count || 100);
    client.emit('latestPlayers', { players: latestPlayers });
  }
}
