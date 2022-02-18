import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Patch,
  Param,
  Get,
  Query,
  Delete,
} from '@nestjs/common';

import { IdDto } from '../dto/id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';
import { UserRoles } from '../auth/enums/user-roles.enum';
import { PostsService } from '../posts/posts.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private restaurantsService: RestaurantsService,
    private postsService: PostsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: CreateRestaurantDto) {
    return await this.restaurantsService.create({
      ...body,
      admin: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param() { id }: IdDto,
    @Body() body: UpdateRestaurantDto,
  ) {
    return await this.restaurantsService.update(
      {
        _id: id,
        admin: req.user.id,
      },
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param() { id }: IdDto) {
    if (req.user.role === UserRoles.Admin) {
      await this.postsService.updateMany(
        { restaurant: id },
        { $set: { restaurant: null } },
      );

      return await this.restaurantsService.delete({
        _id: id,
      });
    } else {
      return await this.restaurantsService.delete({
        _id: id,
        admin: req.user.id,
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getList(
    @Request() req,
    @Query('tag') tag: string,
    @Query('keyword') keyword: string,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    if (!keyword) keyword = '';
    if (!page) page = 0;
    if (!perpage) perpage = 10;
    if (!latitude) latitude = 0;
    if (!longitude) longitude = 0;

    switch (tag) {
      default:
        const total = await this.restaurantsService.count({
          $match: {
            $and: keyword.split(' ').map((key) => {
              return { name: { $regex: key, $options: 'i' } };
            }),
          },
        });
        return {
          total,
          totalPage: Math.ceil(total / perpage),
          page,
          perpage,
          data: await this.restaurantsService.search(
            keyword,
            page,
            perpage,
            latitude,
            longitude,
          ),
        };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMy(
    @Request() req,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!page) page = 0;
    if (!perpage) perpage = 10;

    const total = await this.restaurantsService.count({ admin: req.user.id });

    return {
      total,
      totalPage: Math.ceil(total / perpage),
      page,
      perpage,
      data: await this.restaurantsService.find(
        { admin: req.user.id },
        {},
        page,
        perpage,
      ),
    };
  }
}
