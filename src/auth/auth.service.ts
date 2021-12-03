import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { UsersService } from '../users/users.service';
import { IUser } from '../users/interfaces/user.interface';
import { UserRoles } from './enums/user-roles.enum';
import { ILoginResult } from './interfaces/login-result.interface';
import { IRefreshTokenResult } from './interfaces/refresh-token-result.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<IUser> {
    const user = await this.usersService.findOne({ email });
    if (user) {
      if (await compare(password, user.password)) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser): Promise<ILoginResult> {
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

  async register(email: string, password: string): Promise<ILoginResult> {
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

  async refreshToken(user: IUser): Promise<IRefreshTokenResult> {
    const payload = { email: user.email, id: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      access_token_exp_time: +process.env.ACCESS_TOKEN_EXP_TIME,
    };
  }
}
