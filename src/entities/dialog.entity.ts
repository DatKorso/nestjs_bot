import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Agent } from './agent.entity';

@Entity()
export class Dialog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  context: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isAssistant: boolean;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Agent, { nullable: true })
  agent: Agent;
}