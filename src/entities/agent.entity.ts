import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Dialog } from './dialog.entity';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('jsonb')
  config: object;

  @OneToMany(() => Dialog, dialog => dialog.agent)
  dialogs: Dialog[];
}