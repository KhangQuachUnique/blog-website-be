import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketUserManager } from '../sockets/socket-user.manager';
import { Notification } from '../entities/notification.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly socketUsers: SocketUserManager) {}

  handleConnection(client: Socket) {
    console.log('=== WebSocket Connection Attempt ===');
    console.log('Client ID:', client.id);
    console.log('Query params:', client.handshake.auth.userId);

    const userId = Number(client.handshake.auth.userId);

    if (!userId || isNaN(userId)) {
      console.warn(`Invalid userId from client ${client.id}`);
      return;
    }

    this.socketUsers.register(userId, client.id);
    console.log(`Client connected: ${client.id} for user ${userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.socketUsers.unregister(client.id);
  }

  emitToClient(userId: number, notification: Notification) {
    const socketId = this.socketUsers.getSocket(userId);
    if (socketId) this.server.to(socketId).emit('notification:new', notification);
  }

  emitAllClient(notification: Notification) {
    this.server.emit('notification:new', notification);
  }
}
