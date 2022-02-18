import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PostsModule } from '../posts/posts.module';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RestaurantSchema } from './schemas/restaurant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'restaurants',
        schema: RestaurantSchema,
      },
    ]),
    forwardRef(() => PostsModule),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
})
export class RestaurantsModule {}
