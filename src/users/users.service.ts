import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { FilterQuery, Model } from 'mongoose';
import { UpdateResult } from 'mongodb';

import { IObjectId } from '../interfaces/object-id.interface';
import { UserRoles } from '../auth/enums/user-roles.enum';
import { IShowUser, IUser } from './interfaces/user.interface';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('users') private readonly userModel: Model<IUser>,
    @Inject(forwardRef(() => PostsService))
    private postsService: PostsService,
  ) {}

  async findOne(filter: FilterQuery<IUser>, projection = {}): Promise<IUser> {
    const user = await this.userModel.findOne(filter, projection).exec();
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async create(email: string, password: string): Promise<IObjectId> {
    if (await this.userModel.findOne({ email }).exec()) {
      throw new HttpException('Email was registered', HttpStatus.BAD_REQUEST);
    }

    password = await hash(password, process.env.SALT_PASSWORD);

    const user = await new this.userModel({
      email,
      password,
      role: UserRoles.User,
    });
    if (await user.save()) {
      return { _id: user._id };
    } else {
      throw new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    filter: FilterQuery<IUser>,
    projection = {},
  ): Promise<UpdateResult> {
    const result = await this.userModel.updateOne(filter, projection).exec();
    if (!result?.matchedCount) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async learn(userId: string, postId: string, negative = false): Promise<void> {
    const learningRate = negative ? -0.2 / 1.2 : 0.2;

    const postVectorPromise = this.postsService.findOne(
      { _id: postId },
      { _id: 0, vector: 1 },
    );

    const userVectorPromise = this.findOne(
      { _id: userId },
      { _id: 0, vector: 1 },
    );

    const vectorData = await Promise.all([
      postVectorPromise,
      userVectorPromise,
    ]);

    const postVector = vectorData[0].vector;
    const userVector = vectorData[1].vector;

    const sumUserVector = userVector.reduce(
      (partial_sum, a) => partial_sum + a,
      0,
    );

    const newVector = userVector.map(
      (value, index) =>
        ((value + postVector[index] * learningRate) * 10) /
        (sumUserVector + learningRate * 10),
    );

    await this.update({ _id: userId }, { vector: newVector });
  }

  async search(
    keyword: string,
    page: number,
    perPage: number,
  ): Promise<IShowUser[]> {
    return await this.userModel.aggregate([
      {
        $match: {
          $and: keyword.split(' ').map((key) => {
            return { username: { $regex: key, $options: 'i' } };
          }),
        },
      },
      { $sort: { _id: 1 } },
      { $skip: page * perPage },
      { $limit: perPage },
      {
        $project: {
          vector: 0,
          role: 0,
          email: 0,
          password: 0,
        },
      },
    ]);
  }
}
