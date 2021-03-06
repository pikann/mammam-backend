import { Document } from 'mongoose';

export interface IUser extends Document {
  readonly _id: string;
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly avatar: string;
  readonly role: string;
  readonly vector: number[];
}
