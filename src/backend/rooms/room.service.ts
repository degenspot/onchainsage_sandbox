import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async createRoom(name: string, type: string, tokenOrNarrative: string, creator: User): Promise<Room> {
    if (!name || !type || !tokenOrNarrative || !creator) {
      throw new BadRequestException('Missing required fields');
    }
    if (!['token', 'narrative'].includes(type)) {
      throw new BadRequestException('Invalid room type');
    }
    try {
      const room = this.roomRepository.create({
        name,
        type,
        tokenOrNarrative,
        members: [creator],
        admins: [creator],
      });
      return await this.roomRepository.save(room);
    } catch (error) {
      throw new BadRequestException(`Failed to create room: ${error.message}`);
    }
  }

  async joinRoom(roomId: number, user: User): Promise<Room> {
    if (!roomId || !user) {
      throw new BadRequestException('Missing roomId or user');
    }
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId },
        relations: ['members'],
      });
      if (!room) {
        throw new NotFoundException(`Room with ID ${roomId} not found`);
      }
      if (!room.members.some((member) => member.id === user.id)) {
        room.members.push(user);
        await this.roomRepository.save(room);
      }
      return room;
    } catch (error) {
      throw new BadRequestException(`Failed to join room: ${error.message}`);
    }
  }

  async findById(roomId: number): Promise<Room> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId },
        relations: ['members', 'admins'],
      });
      if (!room) {
        throw new NotFoundException(`Room with ID ${roomId} not found`);
      }
      return room;
    } catch (error) {
      throw new BadRequestException(`Failed to find room: ${error.message}`);
    }
  }
}