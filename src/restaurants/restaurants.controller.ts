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
} from '@nestjs/common';

import { IdDto } from '../dto/id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

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
        return await this.restaurantsService.search(
          keyword,
          page,
          perpage,
          latitude,
          longitude,
        );
    }
  }
}
