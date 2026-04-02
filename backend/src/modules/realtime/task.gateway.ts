import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TaskGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  emitTaskCreated(task: unknown): void {
    this.server.emit('task-created', task);
  }

  emitTaskUpdated(task: unknown): void {
    this.server.emit('task-updated', task);
  }

  emitTaskMoved(task: unknown): void {
    this.server.emit('task-moved', task);
  }

  emitTaskDeleted(taskId: string): void {
    this.server.emit('task-deleted', { taskId });
  }
}
