import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type RestaurantDocument = Restaurant & Document;

@Schema({ versionKey: false })
export class Restaurant {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: '' })
  bio: string;

  @Prop({
    type: String,
    default:
      'https://mammam-bucket-dev.s3.ap-southeast-1.amazonaws.com/avatar-default.png',
  })
  avatar: string;

  @Prop({ type: String, required: true, default: '' })
  address: string;

  @Prop({ type: SchemaType.Types.ObjectId, ref: 'users', required: true })
  admin: User;

  @Prop({ type: Number, required: true })
  latitude: number;

  @Prop({ type: Number, required: true })
  longitude: number;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
