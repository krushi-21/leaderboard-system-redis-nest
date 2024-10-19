import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { DatabaseService } from '../services/database.service';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post('players')
  async createPlayer(@Body() playerData: { username: string; email: string }) {
    return this.databaseService.createPlayer(playerData.username, playerData.email);
  }

  @Get('players/:id')
  async getPlayer(@Param('id') id: string) {
    return this.databaseService.getPlayerById(parseInt(id, 10));
  }

  @Put('players/:id')
  async updatePlayer(
    @Param('id') id: string,
    @Body() playerData: Partial<{ username: string; email: string }>,
  ) {
    const [, [updatedPlayer]] = await this.databaseService.updatePlayer(
      parseInt(id, 10),
      playerData,
    );
    return updatedPlayer;
  }

  @Delete('players/:id')
  async deletePlayer(@Param('id') id: string) {
    return this.databaseService.deletePlayer(parseInt(id, 10));
  }

  @Post('scores')
  async submitScore(@Body() scoreData: { playerId: string; gameType: string; score: number }) {
    await this.gameService.updatePlayerScore(scoreData.playerId, scoreData.score);
    return { message: 'Score submitted successfully' };
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('gameType') gameType: string, @Query('limit') limit: string = '10') {
    const topPlayers = await this.gameService.getTopPlayers(parseInt(limit, 10));
    return topPlayers;
  }

  @Get('player-rank')
  async getPlayerRank(@Query('playerId') playerId: string) {
    const rank = await this.gameService.getPlayerRank(playerId);
    return { playerId, rank };
  }

  @Get('player-score')
  async getPlayerScore(@Query('playerId') playerId: string) {
    const score = await this.gameService.getPlayerScore(playerId);
    return { playerId, score };
  }
}
