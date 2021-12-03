import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { FilterQuery, Model } from 'mongoose';
import { UpdateResult } from 'mongodb';

import { IObjectId } from '../interfaces/object-id.interface';
import { UserRoles } from '../auth/enums/user-roles.enum';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(@InjectModel('users') private readonly userModel: Model<IUser>) {}

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
}
