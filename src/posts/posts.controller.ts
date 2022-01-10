import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Put,
  Query,
} from '@nestjs/common';

import GetS3PresignedURL from '../util/s3-presigned-url';
import { IdDto } from '../dto/id.dto';
import { CommentsService } from '../comments/comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private commentsService: CommentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: CreatePostDto) {
    return await this.postsService.create({
      ...body,
      author: req.user.id,
      createdAt: new Date(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param() { id }: IdDto,
    @Body() body: UpdatePostDto,
  ) {
    return await this.postsService.update(
      {
        _id: id,
        author: req.user.id,
      },
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param() { id }: IdDto) {
    return await this.postsService.delete({
      _id: id,
      author: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('presigned-url')
  async getPresignedURL() {
    return await GetS3PresignedURL();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/like')
  async like(@Request() req, @Param() { id }: IdDto) {
    return await this.postsService.update(
      { _id: id },
      { $addToSet: { likes: req.user.id } },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/dislike')
  async dislike(@Request() req, @Param() { id }: IdDto) {
    return await this.postsService.update(
      { _id: id },
      { $pull: { likes: req.user.id } },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/view')
  async view(@Request() req, @Param() { id }: IdDto) {
    return await this.postsService.update(
      { _id: id },
      { $addToSet: { views: req.user.id } },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getList(
    @Request() req,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!page) page = 0;
    if (!perpage) perpage = 10;
    return await this.postsService.getList(page, perpage, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/comments')
  async getListComments(
    @Request() req,
    @Param() { id }: IdDto,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!page) page = 0;
    if (!perpage) perpage = 10;
    const total = await this.commentsService.count({ parent: id });
    return {
      total,
      totalPage: Math.ceil(total / perpage),
      page,
      perpage,
      comments: await this.commentsService.getList(
        id,
        page,
        perpage,
        req.user.id,
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async commentPost(
    @Request() req,
    @Param() { id }: IdDto,
    @Body() body: CreateCommentDto,
  ) {
    await this.postsService.findOne({ _id: id }, { _id: 1 });
    return await this.commentsService.create({
      ...body,
      author: req.user.id,
      parent: id,
      createdAt: new Date(),
    });
  }
}
