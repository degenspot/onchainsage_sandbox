import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { Poll } from "./entities/poll.entity";
import { Vote } from "./entities/vote.entity";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GovernanceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger("GovernanceGateway");

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitPollCreated(poll: Poll) {
    this.server.emit("pollCreated", poll);
  }

  emitVoteCast(pollId: number, vote: Vote) {
    this.server.emit("voteCast", { pollId, vote });
  }

  emitPollUpdated(poll: Poll) {
    this.server.emit("pollUpdated", poll);
  }
}
