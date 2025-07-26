import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('forum')
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Get('posts')
  findAllPosts() {
    return this.forumService.findAllPosts();
  }

  @Get('posts/:id')
  findOnePost(@Param('id') id: string) {
    return this.forumService.findOnePost(+id);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.forumService.createPost(createPostDto, req.user);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(@Param('id') id: string, @Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.forumService.createComment(+id, createCommentDto, req.user);
  }

  @Post('posts/:id/vote/:type')
  @UseGuards(JwtAuthGuard)
  votePost(@Param('id') id: string, @Param('type') type: 'up' | 'down', @Request() req) {
    return this.forumService.votePost(+id, req.user.id, type);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @Request() req) {
    return this.forumService.deletePost(+id, req.user);
  }
}