import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Logger } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';
  import { WhaleMovement } from './whale-monitoring.service';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
    namespace: '/whale-monitor',
  })
  export class WhaleMonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(WhaleMonitoringGateway.name);
    private connectedClients = new Set<Socket>();
  
    handleConnection(client: Socket) {
      this.connectedClients.add(client);
      this.logger.log(`Client connected: ${client.id}`);
      
      // Send initial data
      client.emit('connection-established', {
        message: 'Connected to whale monitoring service',
        timestamp: new Date().toISOString(),
      });
    }
  
    handleDisconnect(client: Socket) {
      this.connectedClients.delete(client);
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    @SubscribeMessage('subscribe-whale-alerts')
    handleSubscribeWhaleAlerts(
      @MessageBody() data: { impactLevels?: string[] },
      @ConnectedSocket() client: Socket,
    ) {
      const impactLevels = data.impactLevels || ['medium', 'high', 'critical'];
      client.data.subscribedImpactLevels = impactLevels;
      
      client.emit('subscription-confirmed', {
        impactLevels,
        message: 'Subscribed to whale alerts',
      });
    }
  
    @SubscribeMessage('subscribe-wallet')
    handleSubscribeWallet(
      @MessageBody() data: { walletAddress: string },
      @ConnectedSocket() client: Socket,
    ) {
      if (!client.data.subscribedWallets) {
        client.data.subscribedWallets = new Set();
      }
      
      client.data.subscribedWallets.add(data.walletAddress);
      
      client.emit('wallet-subscription-confirmed', {
        walletAddress: data.walletAddress,
        message: 'Subscribed to wallet updates',
      });
    }
  
    broadcastWhaleMovement(movement: WhaleMovement) {
      this.connectedClients.forEach(client => {
        const subscribedLevels = client.data.subscribedImpactLevels || ['medium', 'high', 'critical'];
        const subscribedWallets = client.data.subscribedWallets || new Set();
        
        // Send if impact level matches subscription or specific wallet is subscribed
        if (
          subscribedLevels.includes(movement.impactLevel) ||
          subscribedWallets.has(movement.wallet.address)
        ) {
          client.emit('whale-movement', {
            ...movement,
            timestamp: movement.timestamp.toISOString(),
          });
        }
      });
    }
  
    broadcastMarketUpdate(data: any) {
      this.server.emit('market-update', data);
    }
  }