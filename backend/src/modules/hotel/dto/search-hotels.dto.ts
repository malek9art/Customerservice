import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class SearchHotelsDto {
  @ApiProperty({ example: 'Jeddah' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'SA' })
  @IsString()
  @Length(2, 2)
  country: string;

  @ApiProperty({ example: '2026-09-10' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children: number;
}
