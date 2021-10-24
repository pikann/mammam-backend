import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
