import { Logger } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

const singletonEnforcer = Symbol();

class SocketClient {
  socketClient: Socket;
  static socketClientInstance: SocketClient;

  constructor(enforcer: any) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot initialize Socket client single instance');
    }

    this.socketClient = io(process.env.SOCKET_HOST, {
      query: { backendKey: process.env.SOCKET_BACKEND_KEY },
    });

    this.socketClient.on('connect', () => {
      Logger.log('Socket connected!');
    });
  }

  static get instance() {
    if (!this.socketClientInstance) {
      this.socketClientInstance = new SocketClient(singletonEnforcer);
    }

    return this.socketClientInstance;
  }
}

export default SocketClient.instance.socketClient;
