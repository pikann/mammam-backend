import { Document } from 'mongoose';

export interface IComment extends Document {
  readonly _id: string;
  readonly content: string;
  readonly author: string;
  readonly parent: string;
  readonly createdAt: Date;
  readonly likes: string[];
}

export interface IShowUser extends Document {
  readonly _id: string;
  readonly avatar: string;
  readonly username: string;
}

export interface IShowComment extends Document {
  readonly _id: string;
  readonly createdAt: number;
  readonly author: IShowUser;
  readonly content: string;
  readonly likeTotal: number;
  readonly replyTotal: number;
  readonly isLiked: boolean;
}
