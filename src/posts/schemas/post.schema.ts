import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';

import { User } from '../../users/schemas/user.schema';

export type PostDocument = Post & Document;

@Schema({ versionKey: false })
export class Post {
  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: [String], default: [] })
  seens: string[];

  @Prop({ type: SchemaType.Types.ObjectId, ref: 'users', required: true })
  author: User;

  @Prop({ type: String, default: '' })
  restaurant: string;

  @Prop({ type: String, required: true })
  create_at: string;

  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: [String], default: [] })
  comments: string[];

  @Prop({ type: [Number], default: [] })
  vector: number[];
}

export const PostSchema = SchemaFactory.createForClass(Post);