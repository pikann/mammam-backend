import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {
  @Prop({ type: String, default: '' })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, default: '' })
  avatar: string;

  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: [Number], default: [] })
  vector: number[];
}

export const UserSchema = SchemaFactory.createForClass(User);
