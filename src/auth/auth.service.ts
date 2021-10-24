import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { UsersService } from '../users/users.service';
import { IUser } from '../users/interfaces/user.interface';
import { UserRoles } from './enums/user-roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({ email });
    if (user) {
      if (await compare(password, user.password)) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: IUser) {
    const payload = { id: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.SECRET_KEY_REFRESH_TOKEN,
        expiresIn: +process.env.REFRESH_TOKEN_EXP_TIME,
      }),
      id_user: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      access_token_exp_time: +process.env.ACCESS_TOKEN_EXP_TIME,
      refresh_token_exp_time: +process.env.REFRESH_TOKEN_EXP_TIME,
    };
  }

  async register(email: string, password: string) {
    const { _id } = await this.usersService.create(email, password);
    const payload = { id: _id, email: email, role: UserRoles.User };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.SECRET_KEY_REFRESH_TOKEN,
        expiresIn: +process.env.REFRESH_TOKEN_EXP_TIME,
      }),
      id_user: _id,
      email: email,
      username: '',
      role: UserRoles.User,
      access_token_exp_time: +process.env.ACCESS_TOKEN_EXP_TIME,
      refresh_token_exp_time: +process.env.REFRESH_TOKEN_EXP_TIME,
    };
  }

  async refreshToken(user: IUser) {
    const payload = { email: user.email, id: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      access_token_exp_time: +process.env.ACCESS_TOKEN_EXP_TIME,
    };
  }
}
