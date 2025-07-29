import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
// import { Room } from '../rooms/room.entity';
// If the path is incorrect, update it to the correct path

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  type: string; // "message", "signal", "link"

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Room)
  room: Room;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}