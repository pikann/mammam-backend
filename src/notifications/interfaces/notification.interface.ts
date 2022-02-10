import { Document } from 'mongoose';

export interface INotification extends Document {
  readonly _id: string;
  readonly type: string;
  readonly from: string;
  readonly about: string;
  readonly to: string[];
  readonly at: Date;
  readonly seen: string[];
}

export interface IShowUser extends Document {
  readonly _id: string;
  readonly avatar: string;
  readonly username: string;
  readonly bio: string;
  readonly isFollowed: boolean;
}

export interface IShowNotification extends Document {
  readonly _id: string;
  readonly seen: string[];
  readonly at: number;
  readonly about: string;
  readonly from: IShowUser[];
  readonly type: string;
  readonly isSeen: boolean;
}
