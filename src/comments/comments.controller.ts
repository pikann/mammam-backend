import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Param,
  Put,
  Delete,
  Get,
  Query,
} from '@nestjs/common';

import { IdDto } from '../dto/id.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentsService: CommentsService,
    private notificationsService: NotificationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Request() req,
    @Param() { id }: IdDto,
    @Body() body: UpdateCommentDto,
  ) {
    return await this.commentsService.update(
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
    return await this.commentsService.delete({
      _id: id,
      author: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/replies')
  async getListReply(
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
  @Put(':id/like')
  async like(@Request() req, @Param() { id }: IdDto) {
    return await this.commentsService.update(
      { _id: id },
      { $addToSet: { likes: req.user.id } },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/dislike')
  async dislike(@Request() req, @Param() { id }: IdDto) {
    return await this.commentsService.update(
      { _id: id },
      { $pull: { likes: req.user.id } },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/replies')
  async repliesComment(
    @Request() req,
    @Param() { id }: IdDto,
    @Body() body: CreateCommentDto,
  ) {
    const comment = await this.commentsService.findOne({ _id: id });

    if (req.user.id !== '' + comment.author) {
      this.notificationsService.create({
        type: NotificationType.ReplyComment,
        from: req.user.id,
        about: comment.parent,
        to: comment.author,
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
}
