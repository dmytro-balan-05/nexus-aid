import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      'https://nexus-aid-frontend-production.up.railway.app',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      }) as any;

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`chat:${payload.sub}`);
      client.join(`user:${payload.sub}`);

      if (payload.role === 'admin') {
        client.join('admin_room');
      }

      console.log(`[WS] ${payload.role} ${payload.sub} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] ${client.data.userId} disconnected`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.text?.trim()) return;

    const message = await this.chatService.sendMessage(
      userId,
      data.text,
      false,
    );
    this.server.to(`chat:${userId}`).emit('new_message', message);
    this.server
      .to('admin_room')
      .emit('new_message', { chatUserId: userId, message });
    return message;
  }

  emitToUser(userId: string, message: any) {
    this.server.to(`chat:${userId}`).emit('new_message', message);
  }

  emitAdminNotification(chatUserId: string, message: any) {
    this.server.to('admin_room').emit('new_message', { chatUserId, message });
  }

  emitVerificationApproved(userId: string) {
    this.server.to(`user:${userId}`).emit('verification_approved');
  }

  emitVerificationMessage(userId: string, message: any) {
    this.server.to(`user:${userId}`).emit('verification_message', message);
  }

  emitNewVerificationRequest() {
    this.server.to('admin_room').emit('new_verification_request');
  }
}
