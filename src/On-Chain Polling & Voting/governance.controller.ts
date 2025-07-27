import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { GovernanceService } from "./governance.service";
import { CreatePollDto } from "./dto/create-poll.dto";
import { CastVoteDto } from "./dto/cast-vote.dto";
import { AdminActionDto } from "./dto/admin-action.dto";

@Controller("governance")
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post("polls")
  async createPoll(
    @Body() createPollDto: CreatePollDto,
    @Headers("x-wallet-address") walletAddress: string
  ) {
    if (!walletAddress) {
      throw new BadRequestException("Wallet address required");
    }
    return this.governanceService.createPoll(createPollDto, walletAddress);
  }

  @Get("polls")
  async getAllPolls() {
    return this.governanceService.getAllPolls();
  }

  @Get("polls/archived")
  async getArchivedPolls() {
    return this.governanceService.getArchivedPolls();
  }

  @Get("polls/:id")
  async getPollById(@Param("id") id: string) {
    return this.governanceService.getPollById(+id);
  }

  @Get("polls/:id/results")
  async getPollResults(@Param("id") id: string) {
    return this.governanceService.getPollResults(+id);
  }

  @Post("vote")
  async castVote(
    @Body() castVoteDto: CastVoteDto,
    @Headers("x-wallet-address") walletAddress: string
  ) {
    if (!walletAddress) {
      throw new BadRequestException("Wallet address required");
    }
    return this.governanceService.castVote(castVoteDto, walletAddress);
  }

  @Post("admin/action")
  async adminAction(
    @Body() adminActionDto: AdminActionDto,
    @Headers("x-wallet-address") walletAddress: string
  ) {
    if (!walletAddress) {
      throw new BadRequestException("Wallet address required");
    }
    return this.governanceService.adminAction(adminActionDto, walletAddress);
  }
}
