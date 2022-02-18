import { Document } from 'mongoose';

import { IRestaurant } from '../../restaurants/interfaces/restaurant.interface';

export interface IPost extends Document {
  readonly _id: string;
  readonly description: string;
  readonly url: string;
  readonly thumbnail: string;
  readonly views: string[];
  readonly author: string;
  readonly restaurant: string;
  readonly createdAt: Date;
  readonly likes: string[];
  readonly vector: number[];
}

export interface IShowUser extends Document {
  readonly _id: string;
  readonly avatar: string;
  readonly username: string;
  readonly bio: string;
  readonly isFollowed: boolean;
}

export interface IShowPost extends Document {
  readonly _id: string;
  readonly createdAt: number;
  readonly restaurant: IRestaurant | undefined;
  readonly author: IShowUser;
  readonly url: string;
  readonly thumbnail: string;
  readonly type: string;
  readonly description: string;
  readonly likeTotal: number;
  readonly commentTotal: number;
  readonly viewTotal: number;
  readonly shareTotal: number;
  readonly isLiked: boolean;
}
