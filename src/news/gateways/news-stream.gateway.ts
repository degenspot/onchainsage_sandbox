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
  import { NewsArticle } from '../entities/news-article.entity';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
    namespace: '/news'
  })
  export class NewsStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(NewsStreamGateway.name);
    private connectedClients = new Map<string, any>();
  
    handleConnection(client: Socket) {
      this.logger.log(`Client connected: ${client.id}`);
      this.connectedClients.set(client.id, {
        socket: client,
        filters: {},
        joinedAt: new Date()
      });
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
      this.connectedClients.delete(client.id);
    }
  
    @SubscribeMessage('subscribe-filters')
    handleSubscribeFilters(
      @ConnectedSocket() client: Socket,
      @MessageBody() filters: any
    ) {
      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        clientData.filters = filters;
        this.connectedClients.set(client.id, clientData);
      }
      
      client.emit('subscription-confirmed', { filters });
    }
  
    broadcastNews(article: NewsArticle) {
      this.server.emit('news-update', {
        type: 'new-article',
        data: article,
        timestamp: new Date()
      });
    }
  
    broadcastHighImpactNews(article: NewsArticle) {
      this.server.emit('high-impact-news', {
        type: 'high-impact',
        data: article,
        timestamp: new Date()
      });
    }
  
    @SubscribeMessage('get-stats')
    handleGetStats(@ConnectedSocket() client: Socket) {
      const stats = {
        connectedClients: this.connectedClients.size,
        serverTime: new Date()
      };
      
      client.emit('stats-update', stats);
    }
  }