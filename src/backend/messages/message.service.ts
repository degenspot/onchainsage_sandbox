import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createMessage(content: string, type: string, user: User, room: Room): Promise<Message> {
    const message = this.messageRepository.create({ content, type, user, room });
    return this.messageRepository.save(message);
  }
}