import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Dialog } from './dialog.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telegramId: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  username: string;

  @Column({ default: () => 'now()' })
  createdAt: Date;

  @OneToMany(() => Dialog, dialog => dialog.user)
  dialogs: Dialog[];
}