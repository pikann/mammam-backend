import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';

import { Restaurant } from '../../restaurants/schemas/restaurant.schema';
import { User } from '../../users/schemas/user.schema';

export type PostDocument = Post & Document;

@Schema({ versionKey: false })
export class Post {
  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: true })
  thumbnail: string;

  @Prop({ type: [SchemaType.Types.ObjectId], default: [] })
  views: User[];

  @Prop({ type: SchemaType.Types.ObjectId, ref: 'users', required: true })
  author: User;

  @Prop({ type: SchemaType.Types.ObjectId, ref: 'restaurant', default: null })
  restaurant: Restaurant;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: [SchemaType.Types.ObjectId], default: [] })
  likes: User[];

  @Prop({ type: [Number], default: [] })
  vector: number[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
