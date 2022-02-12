import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  longitude: number;
}
