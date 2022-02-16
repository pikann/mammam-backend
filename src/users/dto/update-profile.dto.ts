import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @IsOptional()
  @IsString()
  bio: string;
}
