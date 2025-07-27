import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Poll, PollStatus } from "./entities/poll.entity";
import { Vote } from "./entities/vote.entity";
import { CreatePollDto } from "./dto/create-poll.dto";
import { CastVoteDto } from "./dto/cast-vote.dto";
import { AdminActionDto, AdminAction } from "./dto/admin-action.dto";
import { BlockchainService } from "./blockchain.service";
import { GovernanceGateway } from "./governance.gateway";

@Injectable()
export class GovernanceService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    private blockchainService: BlockchainService,
    private governanceGateway: GovernanceGateway
  ) {}

  async createPoll(
    createPollDto: CreatePollDto,
    creatorAddress: string
  ): Promise<Poll> {
    // Verify creator has minimum token balance
    const tokenBalance = await this.blockchainService.getTokenBalance(
      creatorAddress
    );
    if (tokenBalance < (createPollDto.minimumTokenBalance || 0)) {
      throw new ForbiddenException("Insufficient token balance to create poll");
    }

    const poll = this.pollRepository.create({
      ...createPollDto,
      creatorAddress,
      endDate: new Date(createPollDto.endDate),
    });

    const savedPoll = await this.pollRepository.save(poll);

    // Emit real-time update
    this.governanceGateway.emitPollCreated(savedPoll);

    return savedPoll;
  }

  async getAllPolls(): Promise<Poll[]> {
    return this.pollRepository.find({
      relations: ["votes"],
      order: { createdAt: "DESC" },
    });
  }

  async getPollById(id: number): Promise<Poll> {
    const poll = await this.pollRepository.findOne({
      where: { id },
      relations: ["votes"],
    });

    if (!poll) {
      throw new NotFoundException("Poll not found");
    }

    return poll;
  }

  async castVote(
    castVoteDto: CastVoteDto,
    voterAddress: string
  ): Promise<Vote> {
    const poll = await this.getPollById(castVoteDto.pollId);

    // Check if poll is active
    if (poll.status !== PollStatus.ACTIVE) {
      throw new BadRequestException("Poll is not active");
    }

    // Check if poll has ended
    const now = new Date();
    const endDate = poll.extendedUntil || poll.endDate;
    if (now > endDate) {
      throw new BadRequestException("Poll has ended");
    }

    // Check if user already voted
    const existingVote = await this.voteRepository.findOne({
      where: { poll: { id: poll.id }, voterAddress },
    });

    if (existingVote) {
      throw new BadRequestException("User has already voted");
    }

    // Verify token balance
    const tokenBalance = await this.blockchainService.getTokenBalance(
      voterAddress
    );
    if (tokenBalance < poll.minimumTokenBalance) {
      throw new ForbiddenException("Insufficient token balance to vote");
    }

    // Verify signature
    const message = `Vote for poll ${poll.id} option ${castVoteDto.optionIndex}`;
    const isValidSignature = await this.blockchainService.verifySignature(
      message,
      castVoteDto.signature,
      voterAddress
    );

    if (!isValidSignature) {
      throw new BadRequestException("Invalid signature");
    }

    // Validate option index
    if (castVoteDto.optionIndex >= poll.options.length) {
      throw new BadRequestException("Invalid option index");
    }

    const blockNumber = await this.blockchainService.getBlockNumber();

    const vote = this.voteRepository.create({
      poll,
      voterAddress,
      optionIndex: castVoteDto.optionIndex,
      tokenBalance,
      transactionHash: `0x${Date.now().toString(16)}`, // Mock transaction hash
      blockNumber,
    });

    const savedVote = await this.voteRepository.save(vote);

    // Emit real-time update
    this.governanceGateway.emitVoteCast(poll.id, savedVote);

    return savedVote;
  }

  async getPollResults(pollId: number) {
    const poll = await this.getPollById(pollId);

    const votes = await this.voteRepository.find({
      where: { poll: { id: pollId } },
    });

    const results = poll.options.map((option, index) => {
      const optionVotes = votes.filter((vote) => vote.optionIndex === index);
      const voteCount = optionVotes.length;
      const tokenWeight = optionVotes.reduce(
        (sum, vote) => sum + vote.tokenBalance,
        0
      );

      return {
        option,
        index,
        voteCount,
        tokenWeight,
        percentage: votes.length > 0 ? (voteCount / votes.length) * 100 : 0,
      };
    });

    return {
      poll,
      results,
      totalVotes: votes.length,
      totalTokenWeight: votes.reduce((sum, vote) => sum + vote.tokenBalance, 0),
    };
  }

  async adminAction(
    adminActionDto: AdminActionDto,
    adminAddress: string
  ): Promise<Poll> {
    // TODO: Implement admin verification logic (could be token-based or role-based)
    const adminTokenBalance = await this.blockchainService.getTokenBalance(
      adminAddress
    );
    if (adminTokenBalance < 1000) {
      // Example: admin needs 1000+ tokens
      throw new ForbiddenException("Insufficient privileges for admin action");
    }

    const poll = await this.getPollById(adminActionDto.pollId);

    if (adminActionDto.action === AdminAction.CLOSE) {
      poll.status = PollStatus.CLOSED;
    } else if (adminActionDto.action === AdminAction.EXTEND) {
      if (!adminActionDto.extendUntil) {
        throw new BadRequestException("Extension date required");
      }
      poll.status = PollStatus.EXTENDED;
      poll.extendedUntil = new Date(adminActionDto.extendUntil);
    }

    const updatedPoll = await this.pollRepository.save(poll);

    // Emit real-time update
    this.governanceGateway.emitPollUpdated(updatedPoll);

    return updatedPoll;
  }

  async getArchivedPolls(): Promise<Poll[]> {
    return this.pollRepository.find({
      where: { status: PollStatus.CLOSED },
      relations: ["votes"],
      order: { updatedAt: "DESC" },
    });
  }
}
