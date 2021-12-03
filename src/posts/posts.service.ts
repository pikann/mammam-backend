import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { UpdateResult, DeleteResult } from 'mongodb';

import { IObjectId } from '../interfaces/object-id.interface';
import { IPost } from './interfaces/post.interface';

@Injectable()
export class PostsService {
  constructor(@InjectModel('posts') private readonly postModel: Model<IPost>) {}

  async findOne(filter: FilterQuery<IPost>, projection = {}): Promise<IPost> {
    const post = await this.postModel.findOne(filter, projection).exec();
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async create(payload: AnyKeys<IPost>): Promise<IObjectId> {
    const post = await new this.postModel(payload);
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
}
