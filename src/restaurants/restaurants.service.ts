import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { UpdateResult } from 'mongodb';

import { IObjectId } from '../interfaces/object-id.interface';
import { IRestaurant } from './interfaces/restaurant.interface';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel('restaurants')
    private readonly restaurantModel: Model<IRestaurant>,
  ) {}

  async create(payload: AnyKeys<IRestaurant>): Promise<IObjectId> {
    const restaurant = await new this.restaurantModel(payload);
    if (await restaurant.save()) {
      return { _id: restaurant._id };
    } else {
      throw new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    filter: FilterQuery<IRestaurant>,
    projection = {},
  ): Promise<UpdateResult> {
    const result = await this.restaurantModel
      .updateOne(filter, projection)
      .exec();
    if (!result?.matchedCount) {
      throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async count(filter: FilterQuery<IRestaurant>): Promise<number> {
    return await this.restaurantModel.count(filter).exec();
  }

  async search(
    keyword: string,
    page: number,
    perPage: number,
    latitude: number,
    longitude: number,
  ): Promise<IRestaurant[]> {
    return this.restaurantModel.aggregate([
      {
        $match: {
          $and: keyword.split(' ').map((key) => {
            return { name: { $regex: key, $options: 'i' } };
          }),
        },
      },
      {
        $set: {
          longitudeDistance: {
            $subtract: ['$longitude', longitude],
          },
          latitudeDistance: {
            $subtract: ['$latitude', latitude],
          },
        },
      },
      {
        $set: {
          distance: {
            $sqrt: {
              $add: [
                { $multiply: ['$longitudeDistance', '$longitudeDistance'] },
                { $multiply: ['$latitudeDistance', '$latitudeDistance'] },
              ],
            },
          },
        },
      },
      { $sort: { distance: 1 } },
      { $skip: page * perPage },
      { $limit: perPage },
      {
        $project: {
          longitudeDistance: 0,
          latitudeDistance: 0,
        },
      },
    ]);
  }
}
