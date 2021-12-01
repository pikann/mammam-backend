import {
  Controller,
  Request,
  Get,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';

import { ValidatePayloadExistsPipe } from '../pipes/validate-payload-exists.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.usersService.findOne(
      { _id: req.user.id },
      { password: 0, vector: 0 },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body(new ValidatePayloadExistsPipe()) body: UpdateProfileDto,
  ) {
    return await this.usersService.update({ _id: req.user.id }, body);
  }
}
