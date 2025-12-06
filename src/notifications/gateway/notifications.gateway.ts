import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketUserManager } from '../sockets/socket-user.manager';

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    console.log('Query params:', client.handshake.query);

    const userId = Number(client.handshake.query.userId);

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

  emitToClient(clientId: number, event: string, data: any) {
    const socketId = this.socketUsers.getSocket(clientId);
    if (socketId) this.server.to(socketId).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
