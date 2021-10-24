import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { FilterQuery, Model } from 'mongoose';

import { UserRoles } from '../auth/enums/user-roles.enum';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(@InjectModel('users') private readonly userModel: Model<IUser>) {}

  async findOne(payload: FilterQuery<IUser>): Promise<any> {
    const user = await this.userModel.findOne(payload).exec();
    return user;
  }

  async create(email: string, password: string) {
    if (await this.findOne({ email })) {
      throw new HttpException('Email was registered', HttpStatus.BAD_REQUEST);
    }

    password = await hash(password, process.env.SALT_PASSWORD);

    const user = await new this.userModel({
      email,
      password,
      role: UserRoles.User,
    });
    if (user.save()) {
      return { _id: user._id };
    } else {
      throw new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePassword(id: string, password: string) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { password })
      .exec();
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return { _id: user._id };
  }
}
