import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';

import { Post } from '../../posts/schemas/post.schema';
import { User } from '../../users/schemas/user.schema';

export type CommentDocument = Comment & Document;

@Schema({ versionKey: false })
export class Comment {
  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: SchemaType.Types.ObjectId, ref: 'users', required: true })
  author: User;

  @Prop({ type: SchemaType.Types.ObjectId, required: true })
  parent: Post | Comment;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: [SchemaType.Types.ObjectId], default: [] })
  likes: User[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
