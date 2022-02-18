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
import { IUser } from '../users/interfaces/user.interface';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('posts') private readonly postModel: Model<IPost>,
    @InjectModel('users') private readonly userModel: Model<IUser>,
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

  async updateMany(filter: any, projection = {}): Promise<UpdateResult> {
    const result = await this.postModel.updateMany(filter, projection).exec();

    return result;
  }

  async delete(filter: FilterQuery<IPost>): Promise<DeleteResult> {
    const result = await this.postModel.deleteOne(filter).exec();
    if (result.deletedCount === 0) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async count(filter: FilterQuery<IPost>): Promise<number> {
    return await this.postModel.count(filter).exec();
  }

  async getListForYou(
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
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $set: {
          restaurant: { $first: '$restaurant' },
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
          'author.isFollowed': {
            $in: [new Types.ObjectId(userId), '$author.followers'],
          },
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
          'author.banning': 0,
          'author.followers': 0,
          views: 0,
          score: 0,
        },
      },
    ]);
    return posts;
  }

  async getListPopular(
    perPage: number,
    userId: string,
    availableList: Types.ObjectId[],
  ): Promise<IShowPost[]> {
    const userVector = (
      await this.usersService.findOne({ _id: userId }, { _id: 0, vector: 1 })
    ).vector;

    const posts: IShowPost[] = await this.userModel.aggregate([
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
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'likes',
          as: 'liked',
        },
      },
      {
        $project: {
          _id: 0,
          liked: 1,
          score: 1,
        },
      },
      { $unwind: '$liked' },
      {
        $set: {
          _id: '$liked._id',
          vector: '$liked.vector',
          likes: '$liked.likes',
          createdAt: '$liked.createdAt',
          restaurant: '$liked.restaurant',
          author: '$liked.author',
          views: '$liked.views',
          url: '$liked.url',
          description: '$liked.description',
          thumbnail: '$liked.thumbnail',
        },
      },
      {
        $project: {
          liked: 0,
        },
      },
      {
        $group: {
          _id: '$_id',
          score: { $sum: '$score' },
          vector: { $first: '$vector' },
          likes: { $first: '$likes' },
          createdAt: { $first: '$createdAt' },
          restaurant: { $first: '$restaurant' },
          author: { $first: '$author' },
          views: { $first: '$views' },
          url: { $first: '$url' },
          description: { $first: '$description' },
          thumbnail: { $first: '$thumbnail' },
        },
      },
      { $match: { views: { $not: { $eq: new Types.ObjectId(userId) } } } },
      { $match: { _id: { $not: { $in: availableList } } } },
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
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $set: {
          restaurant: { $first: '$restaurant' },
        },
      },
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
          'author.isFollowed': {
            $in: [new Types.ObjectId(userId), '$author.followers'],
          },
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
          'author.banning': 0,
          'author.followers': 0,
          views: 0,
          score: 0,
        },
      },
    ]);
    return posts;
  }

  async getListFollowing(
    perPage: number,
    userId: string,
    availableList: Types.ObjectId[],
  ): Promise<IShowPost[]> {
    return this.postModel.aggregate([
      { $match: { views: { $not: { $eq: new Types.ObjectId(userId) } } } },
      { $match: { _id: { $not: { $in: availableList } } } },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      { $match: { 'author.followers': new Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $limit: perPage },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $set: {
          restaurant: { $first: '$restaurant' },
        },
      },
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
          'author.isFollowed': {
            $in: [new Types.ObjectId(userId), '$author.followers'],
          },
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
          'author.banning': 0,
          'author.followers': 0,
          views: 0,
        },
      },
    ]);
  }

  async getListOfUser(
    page: number,
    perPage: number,
    id: string,
    userId: string,
  ): Promise<IShowPost[]> {
    return this.postModel.aggregate([
      { $match: { author: new Types.ObjectId(id) } },
      { $sort: { createdAt: -1 } },
      { $skip: page * perPage },
      { $limit: perPage },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $set: {
          restaurant: { $first: '$restaurant' },
        },
      },
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
          author: 0,
          views: 0,
        },
      },
    ]);
  }

  async getListOfRestaurant(
    page: number,
    perPage: number,
    id: string,
    userId: string,
  ): Promise<IShowPost[]> {
    return this.postModel.aggregate([
      { $match: { restaurant: new Types.ObjectId(id) } },
      { $sort: { createdAt: -1 } },
      { $skip: page * perPage },
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
          restaurant: 0,
          'author.vector': 0,
          'author.role': 0,
          'author.email': 0,
          'author.password': 0,
          'author.banning': 0,
          'author.followers': 0,
          views: 0,
        },
      },
    ]);
  }

  async search(
    keyword: string,
    page: number,
    perPage: number,
    userId: string,
  ): Promise<IShowPost[]> {
    return this.postModel.aggregate([
      {
        $match: {
          $and: keyword.split(' ').map((key) => {
            return { description: { $regex: key, $options: 'i' } };
          }),
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: page * perPage },
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
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $set: {
          restaurant: { $first: '$restaurant' },
        },
      },
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
          'author.isFollowed': {
            $in: [new Types.ObjectId(userId), '$author.followers'],
          },
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
          'author.banning': 0,
          'author.followers': 0,
          views: 0,
        },
      },
    ]);
  }

  async getOne(id: string, userId: string): Promise<IShowPost> {
    return (
      await this.postModel.aggregate([
        {
          $match: { _id: new Types.ObjectId(id) },
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
            from: 'restaurants',
            localField: 'restaurant',
            foreignField: '_id',
            as: 'restaurant',
          },
        },
        {
          $set: {
            restaurant: { $first: '$restaurant' },
          },
        },
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
            'author.isFollowed': {
              $in: [new Types.ObjectId(userId), '$author.followers'],
            },
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
            'author.banning': 0,
            'author.followers': 0,
            views: 0,
          },
        },
      ])
    )[0];
  }
}
