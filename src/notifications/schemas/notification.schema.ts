import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';

import { Post } from '../../posts/schemas/post.schema';
import { User } from '../../users/schemas/user.schema';

export type NotificationDocument = Notification & Document;

@Schema({ versionKey: false })
export class Notification {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: SchemaType.Types.ObjectId, ref: 'users', required: true })
  from: User;

  @Prop({ type: SchemaType.Types.ObjectId, required: true })
  about: Post | User;

  @Prop({ type: [SchemaType.Types.ObjectId], ref: 'users', required: true })
  to: User[];

  @Prop({ type: Date, required: true })
  at: Date;

  @Prop({ type: [SchemaType.Types.ObjectId], default: [] })
  seen: User[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
