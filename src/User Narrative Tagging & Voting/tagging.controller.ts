import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  Put,
} from "@nestjs/common";
import { TaggingService } from "./tagging.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { VoteTagDto } from "./dto/vote-tag.dto";
import { FlagTagDto } from "./dto/flag-tag.dto";
import { TagQueryDto } from "./dto/tag-query.dto";
// Assuming you have authentication guards
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@Controller("tagging")
// @UseGuards(JwtAuthGuard)
export class TaggingController {
  constructor(private readonly taggingService: TaggingService) {}

  @Post("tags")
  async createTag(@Body() createTagDto: CreateTagDto, @Request() req: any) {
    const userId = req.user?.id || "mock-user-id"; // Mock for development
    return await this.taggingService.createTag(createTagDto, userId);
  }

  @Post("vote")
  async voteOnTag(@Body() voteTagDto: VoteTagDto, @Request() req: any) {
    const userId = req.user?.id || "mock-user-id";
    return await this.taggingService.voteOnTag(voteTagDto, userId);
  }

  @Post("flag")
  async flagTag(@Body() flagTagDto: FlagTagDto, @Request() req: any) {
    const userId = req.user?.id || "mock-user-id";
    return await this.taggingService.flagTag(flagTagDto, userId);
  }

  @Get("tags")
  async getTags(@Query() queryDto: TagQueryDto) {
    return await this.taggingService.getTags(queryDto);
  }

  @Get("tags/top")
  async getTopTags(@Query("limit") limit?: number) {
    return await this.taggingService.getTopTags(limit);
  }

  @Get("tags/:id")
  async getTag(@Param("id") id: string) {
    return await this.taggingService.getTagById(id);
  }

  @Get("users/:userId/history")
  async getUserTagHistory(@Param("userId") userId: string) {
    return await this.taggingService.getUserTagHistory(userId);
  }

  @Get("flags/pending")
  // @Roles('moderator', 'admin')
  // @UseGuards(RolesGuard)
  async getPendingFlags() {
    return await this.taggingService.getPendingFlags();
  }

  @Put("flags/:flagId/review")
  // @Roles('moderator', 'admin')
  // @UseGuards(RolesGuard)
  async reviewFlag(
    @Param("flagId") flagId: string,
    @Body("action") action: "approve" | "dismiss",
    @Request() req: any
  ) {
    const moderatorId = req.user?.id || "mock-moderator-id";
    return await this.taggingService.reviewFlag(flagId, action, moderatorId);
  }
}
