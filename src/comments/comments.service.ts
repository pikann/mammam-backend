import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model, Types } from 'mongoose';
import { UpdateResult, DeleteResult } from 'mongodb';

import { IObjectId } from '../interfaces/object-id.interface';
import { IComment, IShowComment } from './interfaces/comment.interface';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel('comments') private readonly commentModel: Model<IComment>,
  ) {}

  async findOne(
    filter: FilterQuery<IComment>,
    projection = {},
  ): Promise<IComment> {
    const comment = await this.commentModel.findOne(filter, projection).exec();
    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    return comment;
  }

  async getList(
    parent: string,
    page: number,
    perPage: number,
    userId: string,
  ): Promise<IShowComment[]> {
    const comments: IShowComment[] = await this.commentModel.aggregate([
      {
        $match: {
          parent: new Types.ObjectId(parent),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parent',
          as: 'replies',
        },
      },
      {
        $set: {
          likeTotal: { $size: '$likes' },
          replyTotal: { $size: '$replies' },
          isLiked: { $in: [new Types.ObjectId(userId), '$likes'] },
          createdAt: { $toLong: '$createdAt' },
        },
      },
      { $set: { sortScore: { $sum: ['$likeTotal', '$replyTotal'] } } },
      { $sort: { likeTotal: -1 } },
      { $skip: page * perPage },
      { $limit: perPage },
      {
        $project: {
          replies: 0,
          likes: 0,
          parent: 0,
          sortScore: 0,
          'author.vector': 0,
          'author.role': 0,
          'author.email': 0,
          'author.password': 0,
        },
      },
    ]);
    return comments;
  }

  async count(filter: FilterQuery<IComment>): Promise<number> {
    return await this.commentModel.count(filter).exec();
  }

  async create(payload: AnyKeys<IComment>): Promise<IObjectId> {
    const post = await new this.commentModel(payload);
    if (await post.save()) {
      return { _id: post._id };
    } else {
      throw new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(filter: any, projection = {}): Promise<UpdateResult> {
    const result = await this.commentModel.updateOne(filter, projection).exec();
    if (!result?.matchedCount) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async delete(filter: FilterQuery<IComment>): Promise<DeleteResult> {
    const result = await this.commentModel.deleteOne(filter).exec();
    if (result.deletedCount === 0) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}
