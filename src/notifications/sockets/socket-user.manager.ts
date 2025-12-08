import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketUserManager {
  private map = new Map<number, string>();

  register(userId: number, socketId: string) {
    this.map.set(userId, socketId);
  }

  unregister(socketId: string) {
    for (const [userId, sId] of this.map.entries()) {
      if (sId === socketId) this.map.delete(userId);
    }
  }

  getSocket(userId: number) {
    return this.map.get(userId);
  }
}
