import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostSchema } from './schemas/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'posts',
        schema: PostSchema,
      },
    ]),
    forwardRef(() => CommentsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
