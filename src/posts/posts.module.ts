import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

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
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
