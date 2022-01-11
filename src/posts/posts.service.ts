import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model, Types } from 'mongoose';
import { UpdateResult, DeleteResult } from 'mongodb';

import AWSRequestClient from '../util/aws-request';
import { IObjectId } from '../interfaces/object-id.interface';
import { IPost, IShowPost } from './interfaces/post.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('posts') private readonly postModel: Model<IPost>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async findOne(filter: FilterQuery<IPost>, projection = {}): Promise<IPost> {
    const post = await this.postModel.findOne(filter, projection).exec();
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async create(payload: AnyKeys<IPost>): Promise<IObjectId> {
    const vector = (
      await AWSRequestClient.post(process.env.ML_PATH, {
        videoUrl: payload.url,
      })
    ).data.vector;
    const post = await new this.postModel({ ...payload, vector });
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
    const result = await this.postModel.updateOne(filter, projection).exec();
    if (!result?.matchedCount) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async delete(filter: FilterQuery<IPost>): Promise<DeleteResult> {
    const result = await this.postModel.deleteOne(filter).exec();
    if (result.deletedCount === 0) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async getList(
    perPage: number,
    userId: string,
    availableList: Types.ObjectId[],
  ): Promise<IShowPost[]> {
    const userVector = (
      await this.usersService.findOne({ _id: userId }, { _id: 0, vector: 1 })
    ).vector;

    const posts: IShowPost[] = await this.postModel.aggregate([
      { $match: { views: { $not: { $eq: new Types.ObjectId(userId) } } } },
      { $match: { _id: { $not: { $in: availableList } } } },
      {
        $set: {
          score: {
            $reduce: {
              input: { $range: [0, { $size: '$vector' }] },
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $multiply: [
                      { $arrayElemAt: ['$vector', '$$this'] },
                      { $arrayElemAt: [userVector, '$$this'] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: perPage },
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
          as: 'comments',
        },
      },
      {
        $set: {
          likeTotal: { $size: '$likes' },
          commentTotal: { $size: '$comments' },
          viewTotal: { $size: '$views' },
          shareTotal: 0,
          isLiked: { $in: [new Types.ObjectId(userId), '$likes'] },
          createdAt: { $toLong: '$createdAt' },
        },
      },
      {
        $project: {
          vector: 0,
          comments: 0,
          likes: 0,
          'author.vector': 0,
          'author.role': 0,
          'author.email': 0,
          'author.password': 0,
          views: 0,
          score: 0,
        },
      },
    ]);
    return posts;
  }
}
