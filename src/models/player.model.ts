import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Score } from './score.model';

@Table
export class Player extends Model {
  @Column
  username: string;

  @Column
  email: string;

  @HasMany(() => Score)
  scores: Score[];
}
