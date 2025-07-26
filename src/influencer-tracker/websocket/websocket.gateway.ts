import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-token')
  handleSubscribeToken(
    @MessageBody() tokenId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`token-${tokenId}`);
    this.logger.log(`Client ${client.id} subscribed to token ${tokenId}`);
  }

  @SubscribeMessage('subscribe-influencer')
  handleSubscribeInfluencer(
    @MessageBody() influencerId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`influencer-${influencerId}`);
    this.logger.log(`Client ${client.id} subscribed to influencer ${influencerId}`);
  }

  sendAlert(alert: any) {
    this.server.emit('new-alert', alert);
  }

  sendMentionUpdate(mention: any) {
    this.server.to(`token-${mention.tokenId}`).emit('new-mention', mention);
    this.server.to(`influencer-${mention.influencerId}`).emit('influencer-mention', mention);
  }

  sendPriceUpdate(tokenId: string, priceData: any) {
    this.server.to(`token-${tokenId}`).emit('price-update', priceData);
  }
}
