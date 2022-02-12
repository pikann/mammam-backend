import { Document } from 'mongoose';

export interface IRestaurant extends Document {
  readonly _id: string;
  readonly name: string;
  readonly bio: string;
  readonly avatar: string;
  readonly admin: string;
  readonly latitude: number;
  readonly longitude: number;
}
