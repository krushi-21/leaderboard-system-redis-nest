import { BelongsTo, Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Player } from './player.model';

@Table
export class Score extends Model {
  @ForeignKey(() => Player)
  @Column
  playerId: number;

  @BelongsTo(() => Player)
  player: Player;

  @Column
  score: number;
}
