import { IsMongoId, IsOptional, IsString } from 'class-validator';
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  restaurant: string;
}
