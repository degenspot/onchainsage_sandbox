import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, In } from "typeorm";
import { Tag, TagStatus } from "./entities/tag.entity";
import { TagVote, VoteType } from "./entities/tag-vote.entity";
import { TagFlag, FlagStatus } from "./entities/tag-flag.entity";
import { Narrative } from "./entities/narrative.entity";
import { User } from "./entities/user.entity";
import { CreateTagDto } from "./dto/create-tag.dto";
import { VoteTagDto } from "./dto/vote-tag.dto";
import { FlagTagDto } from "./dto/flag-tag.dto";
import { TagQueryDto } from "./dto/tag-query.dto";

@Injectable()
export class TaggingService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(TagVote)
    private readonly tagVoteRepository: Repository<TagVote>,
    @InjectRepository(TagFlag)
    private readonly tagFlagRepository: Repository<TagFlag>,
    @InjectRepository(Narrative)
    private readonly narrativeRepository: Repository<Narrative>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createTag(createTagDto: CreateTagDto, userId: string): Promise<Tag> {
    // Verify narrative exists
    const narrative = await this.narrativeRepository.findOne({
      where: { id: createTagDto.narrativeId },
    });
    if (!narrative) {
      throw new NotFoundException("Narrative not found");
    }

    // Check for duplicate tag on same narrative
    const existingTag = await this.tagRepository.findOne({
      where: {
        narrativeId: createTagDto.narrativeId,
        name: createTagDto.name.toLowerCase().trim(),
      },
    });
    if (existingTag) {
      throw new ConflictException("Tag already exists for this narrative");
    }

    const tag = this.tagRepository.create({
      name: createTagDto.name.toLowerCase().trim(),
      narrativeId: createTagDto.narrativeId,
      creatorId: userId,
    });

    return await this.tagRepository.save(tag);
  }

  async voteOnTag(
    voteTagDto: VoteTagDto,
    userId: string
  ): Promise<{ message: string; tag: Tag }> {
    const tag = await this.tagRepository.findOne({
      where: { id: voteTagDto.tagId, status: TagStatus.ACTIVE },
    });
    if (!tag) {
      throw new NotFoundException("Tag not found or inactive");
    }

    // Users cannot vote on their own tags
    if (tag.creatorId === userId) {
      throw new BadRequestException("Cannot vote on your own tag");
    }

    // Check existing vote
    const existingVote = await this.tagVoteRepository.findOne({
      where: { userId, tagId: voteTagDto.tagId },
    });

    if (existingVote) {
      if (existingVote.voteType === voteTagDto.voteType) {
        // Remove vote if same type
        await this.tagVoteRepository.remove(existingVote);
        await this.updateTagScore(tag.id);
        return { message: "Vote removed", tag: await this.getTagById(tag.id) };
      } else {
        // Update vote type
        existingVote.voteType = voteTagDto.voteType;
        await this.tagVoteRepository.save(existingVote);
        await this.updateTagScore(tag.id);
        return { message: "Vote updated", tag: await this.getTagById(tag.id) };
      }
    }

    // Create new vote
    const vote = this.tagVoteRepository.create({
      userId,
      tagId: voteTagDto.tagId,
      voteType: voteTagDto.voteType,
    });
    await this.tagVoteRepository.save(vote);
    await this.updateTagScore(tag.id);

    return { message: "Vote recorded", tag: await this.getTagById(tag.id) };
  }

  private async updateTagScore(tagId: string): Promise<void> {
    const upvotes = await this.tagVoteRepository.count({
      where: { tagId, voteType: VoteType.UPVOTE },
    });
    const downvotes = await this.tagVoteRepository.count({
      where: { tagId, voteType: VoteType.DOWNVOTE },
    });

    await this.tagRepository.update(tagId, {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
    });
  }

  async flagTag(flagTagDto: FlagTagDto, userId: string): Promise<TagFlag> {
    const tag = await this.tagRepository.findOne({
      where: { id: flagTagDto.tagId },
    });
    if (!tag) {
      throw new NotFoundException("Tag not found");
    }

    // Check if user already flagged this tag
    const existingFlag = await this.tagFlagRepository.findOne({
      where: { tagId: flagTagDto.tagId, reporterId: userId },
    });
    if (existingFlag) {
      throw new ConflictException("You have already flagged this tag");
    }

    const flag = this.tagFlagRepository.create({
      tagId: flagTagDto.tagId,
      reporterId: userId,
      reason: flagTagDto.reason,
      description: flagTagDto.description,
    });

    const savedFlag = await this.tagFlagRepository.save(flag);

    // Auto-flag tag if it receives multiple flags
    const flagCount = await this.tagFlagRepository.count({
      where: { tagId: flagTagDto.tagId, status: FlagStatus.PENDING },
    });

    if (flagCount >= 3) {
      await this.tagRepository.update(flagTagDto.tagId, {
        status: TagStatus.FLAGGED,
      });
    }

    return savedFlag;
  }

  async getTags(
    queryDto: TagQueryDto
  ): Promise<{ tags: Tag[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.tagRepository
      .createQueryBuilder("tag")
      .leftJoinAndSelect("tag.creator", "creator")
      .leftJoinAndSelect("tag.narrative", "narrative")
      .leftJoinAndSelect("narrative.author", "narrativeAuthor");

    // Apply filters
    if (queryDto.search) {
      queryBuilder.andWhere("tag.name ILIKE :search", {
        search: `%${queryDto.search}%`,
      });
    }

    if (queryDto.narrativeId) {
      queryBuilder.andWhere("tag.narrativeId = :narrativeId", {
        narrativeId: queryDto.narrativeId,
      });
    }

    if (queryDto.userId) {
      queryBuilder.andWhere("tag.creatorId = :userId", {
        userId: queryDto.userId,
      });
    }

    if (queryDto.status) {
      queryBuilder.andWhere("tag.status = :status", {
        status: queryDto.status,
      });
    } else {
      queryBuilder.andWhere("tag.status = :status", {
        status: TagStatus.ACTIVE,
      });
    }

    // Apply sorting
    const sortField =
      queryDto.sortBy === "createdAt"
        ? "tag.createdAt"
        : queryDto.sortBy === "upvotes"
        ? "tag.upvotes"
        : "tag.score";
    queryBuilder.orderBy(sortField, queryDto.sortOrder);

    // Apply pagination
    const offset = (queryDto.page - 1) * queryDto.limit;
    queryBuilder.skip(offset).take(queryDto.limit);

    const [tags, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / queryDto.limit);

    return {
      tags,
      total,
      page: queryDto.page,
      totalPages,
    };
  }

  async getTopTags(limit: number = 10): Promise<Tag[]> {
    return await this.tagRepository.find({
      where: { status: TagStatus.ACTIVE },
      order: { score: "DESC", upvotes: "DESC" },
      take: limit,
      relations: ["creator", "narrative"],
    });
  }

  async getUserTagHistory(userId: string): Promise<{
    createdTags: Tag[];
    votes: TagVote[];
    flags: TagFlag[];
  }> {
    const createdTags = await this.tagRepository.find({
      where: { creatorId: userId },
      relations: ["narrative"],
      order: { createdAt: "DESC" },
    });

    const votes = await this.tagVoteRepository.find({
      where: { userId },
      relations: ["tag", "tag.narrative"],
      order: { createdAt: "DESC" },
    });

    const flags = await this.tagFlagRepository.find({
      where: { reporterId: userId },
      relations: ["tag", "tag.narrative"],
      order: { createdAt: "DESC" },
    });

    return { createdTags, votes, flags };
  }

  async getTagById(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
      relations: ["creator", "narrative", "narrative.author"],
    });
    if (!tag) {
      throw new NotFoundException("Tag not found");
    }
    return tag;
  }

  async reviewFlag(
    flagId: string,
    action: "approve" | "dismiss",
    moderatorId: string
  ): Promise<TagFlag> {
    const flag = await this.tagFlagRepository.findOne({
      where: { id: flagId },
      relations: ["tag"],
    });
    if (!flag) {
      throw new NotFoundException("Flag not found");
    }

    if (action === "approve") {
      await this.tagRepository.update(flag.tagId, {
        status: TagStatus.REMOVED,
      });
      flag.status = FlagStatus.REVIEWED;
    } else {
      flag.status = FlagStatus.DISMISSED;
    }

    return await this.tagFlagRepository.save(flag);
  }

  async getPendingFlags(): Promise<TagFlag[]> {
    return await this.tagFlagRepository.find({
      where: { status: FlagStatus.PENDING },
      relations: ["tag", "tag.narrative", "reporter"],
      order: { createdAt: "ASC" },
    });
  }
}
