import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export enum CabinClass {
  ECONOMY = 'ECONOMY',
  PREMIUM = 'PREMIUM',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST',
}

export class FlightPassengersDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  infants: number;
}

export class SearchFlightsDto {
  @ApiProperty({ example: 'ADE' })
  @IsString()
  @Length(3, 3)
  origin: string;

  @ApiProperty({ example: 'JED' })
  @IsString()
  @Length(3, 3)
  destination: string;

  @ApiProperty({ example: '2026-09-10' })
  @IsDateString()
  departureDate: string;

  @ApiPropertyOptional({ example: '2026-09-20' })
  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @ApiProperty({ type: FlightPassengersDto })
  @ValidateNested()
  @Type(() => FlightPassengersDto)
  passengers: FlightPassengersDto;

  @ApiProperty({ enum: CabinClass, example: CabinClass.ECONOMY })
  @IsEnum(CabinClass)
  cabinClass: CabinClass;
}
