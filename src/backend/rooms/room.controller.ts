// src/rooms/room.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { RoomService } from './room.service';
import { User } from '../users/user.entity';

@Controller('rooms')
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Post('create')
  async createRoom(@Body() body: { name: string; type: string; tokenOrNarrative: string; userId: number }) {
    const user = { id: body.userId, username: 'test', email: 'test@example.com' }; // Mock user
    return this.roomService.createRoom(body.name, body.type, body.tokenOrNarrative, user);
  }

  @Post('join')
  async joinRoom(@Body() body: { roomId: number; userId: number }) {
    const user = { id: body.userId, username: 'test', email: 'test@example.com' }; // Mock user
    return this.roomService.joinRoom(body.roomId, user);
  }
}