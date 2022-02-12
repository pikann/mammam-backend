import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
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

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
