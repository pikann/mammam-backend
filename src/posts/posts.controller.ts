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
import { Types } from 'mongoose';

import GetS3PresignedURL from '../util/s3-presigned-url';
import { IdDto } from '../dto/id.dto';
import { UsersService } from '../users/users.service';
import { CommentsService } from '../comments/comments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';
import { GetPostsTag } from './enums/get-posts-tag.enum';
import { UserRoles } from '../auth/enums/user-roles.enum';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private commentsService: CommentsService,
    private userService: UsersService,
    private notificationsService: NotificationsService,
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
    if (req.user.role === UserRoles.Admin) {
      return await this.postsService.delete({
        _id: id,
      });
    } else {
      return await this.postsService.delete({
        _id: id,
        author: req.user.id,
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('presigned-url')
  async getPresignedURL() {
    return await GetS3PresignedURL();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/like')
  async like(@Request() req, @Param() { id }: IdDto) {
    const learnPromise = this.userService.learn(req.user.id, id);
    const likePromise = this.postsService.update(
      { _id: id },
      { $addToSet: { likes: req.user.id } },
    );
    return (await Promise.all([learnPromise, likePromise]))[1];
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/dislike')
  async dislike(@Request() req, @Param() { id }: IdDto) {
    const learnPromise = this.userService.learn(req.user.id, id, true);
    const dislikePromise = this.postsService.update(
      { _id: id },
      { $pull: { likes: req.user.id } },
    );
    return (await Promise.all([learnPromise, dislikePromise]))[1];
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
    @Query('tag') tag: string,
    @Query('perpage') perpage: number,
    @Query('availables') availables: string,
  ) {
    if (!perpage) perpage = 10;

    let availableList = [];
    if (availables && availables !== '')
      availableList = availables.split(',').map((id) => new Types.ObjectId(id));

    switch (tag) {
      case GetPostsTag.Popular:
        return await this.postsService.getListPopular(
          perpage,
          req.user.id,
          availableList,
        );
      case GetPostsTag.Following:
        return await this.postsService.getListFollowing(
          perpage,
          req.user.id,
          availableList,
        );
      default:
        return await this.postsService.getListForYou(
          perpage,
          req.user.id,
          availableList,
        );
    }
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
    const post = await this.postsService.findOne({ _id: id });

    if (req.user.id !== '' + post.author) {
      this.notificationsService.create({
        type: NotificationType.Comment,
        from: req.user.id,
        about: post._id,
        to: post.author,
        at: new Date(),
      });
    }

    return await this.commentsService.create({
      ...body,
      author: req.user.id,
      parent: id,
      createdAt: new Date(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:id')
  async getListPostOfUser(
    @Param() { id }: IdDto,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!page) page = 0;
    if (!perpage) perpage = 10;

    const total = await this.postsService.count({
      author: id,
    });

    return {
      total,
      totalPage: Math.ceil(total / perpage),
      page,
      perpage,
      data: await this.postsService.getListOfUser(page, perpage, id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(
    @Request() req,
    @Query('keyword') keyword: string,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!keyword) keyword = '';
    if (!page) page = 0;
    if (!perpage) perpage = 10;

    const total = await this.postsService.count({
      $and: keyword.split(' ').map((key) => {
        return { description: { $regex: key, $options: 'i' } };
      }),
    });

    return {
      total,
      totalPage: Math.ceil(total / perpage),
      page,
      perpage,
      data: await this.postsService.search(keyword, page, perpage, req.user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Request() req, @Param() { id }: IdDto) {
    return await this.postsService.getOne(id, req.user.id);
  }
}
