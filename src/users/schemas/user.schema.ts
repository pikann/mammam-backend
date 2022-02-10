import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {
  @Prop({ type: String, default: '' })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({
    type: String,
    default:
      'https://mammam-bucket-dev.s3.ap-southeast-1.amazonaws.com/avatar-default.png',
  })
  avatar: string;

  @Prop({ type: String, default: '' })
  bio: string;

  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: [Number], default: new Array(101).fill(0) })
  vector: number[];

  @Prop({ type: Boolean, required: true, default: false })
  banning: boolean;

  @Prop({ type: [SchemaType.Types.ObjectId], default: [] })
  followers: User[];
}

export const UserSchema = SchemaFactory.createForClass(User);
