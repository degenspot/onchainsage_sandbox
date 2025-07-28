import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RoomService } from './room.service';
import { UserService } from '../users/user.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private roomService: RoomService,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.id);
      client.data.user = user;
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`User ${client.data.user.id} disconnected`);
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(@MessageBody() data: { name: string; type: string; tokenOrNarrative: string }, @ConnectedSocket() client: Socket) {
    const room = await this.roomService.createRoom(data.name, data.type, data.tokenOrNarrative, client.data.user);
    client.join(`room_${room.id}`);
    this.server.to(`room_${room.id}`).emit('room_created', room);
    return room;
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() data: { roomId: number }, @ConnectedSocket() client: Socket) {
    const room = await this.roomService.joinRoom(data.roomId, client.data.user);
    client.join(`room_${room.id}`);
    this.server.to(`room_${room.id}`).emit('user_joined', { user: client.data.user, room });
    return room;
  }
}