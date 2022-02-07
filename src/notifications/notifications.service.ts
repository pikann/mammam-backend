import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model, Types } from 'mongoose';
import { UpdateResult } from 'mongodb';

import socketClient from '../util/socket-client';
import { IObjectId } from '../interfaces/object-id.interface';
import { INotification } from './interfaces/notification.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('notifications')
    private readonly notificationModel: Model<INotification>,
  ) {}

  async create(payload: AnyKeys<INotification>): Promise<IObjectId> {
    const notification = await new this.notificationModel(payload);
    if (await notification.save()) {
      socketClient.emit('message', {
        room: notification.to,
        data: notification,
      });
      return { _id: notification._id };
    } else {
      throw new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(filter: any, projection = {}): Promise<UpdateResult> {
    const result = await this.notificationModel
      .updateMany(filter, projection)
      .exec();
    if (!result?.matchedCount) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async count(filter: FilterQuery<INotification>): Promise<number> {
    return await this.notificationModel.count(filter).exec();
  }

  async getList(page: number, perPage: number, userId: string): Promise<any> {
    return this.notificationModel.aggregate([
      {
        $match: { to: new Types.ObjectId(userId) },
      },
      { $sort: { createdAt: -1 } },
      { $skip: page * perPage },
      { $limit: perPage },
      {
        $lookup: {
          from: 'users',
          localField: 'from',
          foreignField: '_id',
          as: 'from',
        },
      },
      {
        $set: {
          isSeen: { $in: [new Types.ObjectId(userId), '$seen'] },
          at: { $toLong: '$at' },
        },
      },
      {
        $project: {
          to: 0,
          'from.vector': 0,
          'from.role': 0,
          'from.email': 0,
          'from.password': 0,
          'from.banning': 0,
        },
      },
    ]);
  }
}