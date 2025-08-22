import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'trading-signals',
})
export class SignalWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SignalWebSocketGateway.name);
  private clientSubscriptions: Map<string, Set<string>> = new Map(); // clientId -> Set of tokenAddresses

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe-signals')
  handleSubscribeSignals(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenAddress: string }
  ): void {
    const { tokenAddress } = data;
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Add to client's subscriptions
    this.clientSubscriptions.get(client.id)?.add(normalizedAddress);
    
    // Join room for this token
    client.join(`signals:${normalizedAddress}`);
    
    this.logger.log(`Client ${client.id} subscribed to signals for ${tokenAddress}`);
    client.emit('subscription-confirmed', { tokenAddress, type: 'signals' });
  }

  @SubscribeMessage('unsubscribe-signals')
  handleUnsubscribeSignals(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenAddress: string }
  ): void {
    const { tokenAddress } = data;
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Remove from client's subscriptions
    this.clientSubscriptions.get(client.id)?.delete(normalizedAddress);
    
    // Leave room for this token
    client.leave(`signals:${normalizedAddress}`);
    
    this.logger.log(`Client ${client.id} unsubscribed from signals for ${tokenAddress}`);
    client.emit('unsubscription-confirmed', { tokenAddress, type: 'signals' });
  }

  @SubscribeMessage('get-active-signals')
  handleGetActiveSignals(@ConnectedSocket() client: Socket): void {
    // This would typically fetch active signals and send them back
    // For now, we'll just confirm the request
    client.emit('active-signals-request-received');
  }

  // Method to broadcast signals (called by NotificationService)
  broadcastSignal(tokenAddress: string, signalData: any): void {
    const normalizedAddress = tokenAddress.toLowerCase();
    this.server.to(`signals:${normalizedAddress}`).emit('new-signal', signalData);
  }

  // Method to broadcast strong signals to all connected clients
  broadcastStrongSignal(signalData: any): void {
    this.server.emit('strong-signal-alert', signalData);
  }
}