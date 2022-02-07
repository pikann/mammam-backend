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
