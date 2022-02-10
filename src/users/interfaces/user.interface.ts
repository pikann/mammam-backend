import { Document } from 'mongoose';

export interface IUser extends Document {
  readonly _id: string;
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly avatar: string;
  readonly bio: string;
  readonly role: string;
  readonly vector: number[];
  readonly banning: boolean;
  readonly followers: string[];
}

export interface IShowUser {
  readonly _id: string;
  readonly username: string;
  readonly avatar: string;
  readonly bio: string;
  readonly isFollowed: boolean;
}
