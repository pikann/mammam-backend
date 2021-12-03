import { Document } from 'mongoose';

export interface IPost extends Document {
  readonly _id: string;
  readonly description: string;
  readonly type: string;
  readonly url: string;
  readonly seens: string[];
  readonly author: string;
  readonly restaurant: string;
  readonly create_at: Date;
  readonly likes: string[];
  readonly comments: string[];
  readonly vector: number[];
}
