import {
  Controller,
  Request,
  Get,
  UseGuards,
  Patch,
  Body,
  Put,
  HttpException,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { hash } from 'bcrypt';

import { ValidatePayloadExistsPipe } from '../pipes/validate-payload-exists.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Roles } from '../auth/decorators/role.decorator';
import { UserRoles } from '../auth/enums/user-roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IdDto } from '../dto/id.dto';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private notificationsService: NotificationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.usersService.findOne(
      { _id: req.user.id },
      { password: 0, vector: 0, banning: 0 },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!keyword) keyword = '';
    if (!page) page = 0;
    if (!perpage) perpage = 10;

    const total = await this.usersService.count({
      $and: keyword.split(' ').map((key) => {
        return { username: { $regex: key, $options: 'i' } };
      }),
    });

    return {
      total,
      totalPage: Math.ceil(total / perpage),
      page,
      perpage,
      data: await this.usersService.search(keyword, page, perpage),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body(new ValidatePayloadExistsPipe()) body: UpdateProfileDto,
  ) {
    return await this.usersService.update({ _id: req.user.id }, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async updatePassword(@Request() req, @Body() body: UpdatePasswordDto) {
    if (await this.authService.validateUser(req.user.email, body.oldPassword)) {
      const newPassword = await hash(
        body.newPassword,
        process.env.SALT_PASSWORD,
      );
      return await this.usersService.update(
        { _id: req.user.id },
        { password: newPassword },
      );
    } else {
      throw new HttpException(
        'Old password not correct!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id/ban')
  @Roles(UserRoles.Admin)
  async ban(@Param() { id }: IdDto) {
    return await this.usersService.update({ _id: id }, { banning: true });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id/unban')
  @Roles(UserRoles.Admin)
  async unban(@Param() { id }: IdDto) {
    return await this.usersService.update({ _id: id }, { banning: false });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/follow')
  async follow(@Request() req, @Param() { id }: IdDto) {
    if (req.user.id !== '' + id) {
      this.notificationsService.create({
        type: NotificationType.Follow,
        from: req.user.id,
        about: req.user.id,
        to: id,
        at: new Date(),
      });
    }

    return await this.usersService.update(
      { _id: id },
      { $addToSet: { followers: req.user.id } },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/unfollow')
  async unfollow(@Request() req, @Param() { id }: IdDto) {
    return await this.usersService.update(
      { _id: id },
      { $pull: { followers: req.user.id } },
    );
  }
}
