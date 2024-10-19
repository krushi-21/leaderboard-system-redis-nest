import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from '../models/player.model';
import { Score } from '../models/score.model';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(Player)
    private playerModel: typeof Player,
    @InjectModel(Score)
    private scoreModel: typeof Score,
  ) {}

  async createPlayer(username: string, email: string): Promise<Player> {
    return this.playerModel.create({ username, email });
  }

  async getPlayerById(id: number): Promise<Player> {
    return this.playerModel.findByPk(id, { include: [Score] });
  }

  async updatePlayer(id: number, data: Partial<Player>): Promise<[number, Player[]]> {
    return this.playerModel.update(data, { where: { id }, returning: true });
  }

  async deletePlayer(id: number): Promise<number> {
    return this.playerModel.destroy({ where: { id } });
  }

  async createScore(playerId: number, score: number): Promise<Score> {
    return this.scoreModel.create({ playerId, score });
  }

  async getScoresByPlayerId(playerId: number): Promise<Score[]> {
    return this.scoreModel.findAll({ where: { playerId } });
  }

  async getTopScores(limit: number = 10): Promise<Score[]> {
    return this.scoreModel.findAll({
      order: [['score', 'DESC']],
      limit,
      include: [Player],
    });
  }

  async updateScore(id: number, data: Partial<Score>): Promise<[number, Score[]]> {
    return this.scoreModel.update(data, { where: { id }, returning: true });
  }

  async deleteScore(id: number): Promise<number> {
    return this.scoreModel.destroy({ where: { id } });
  }
}
