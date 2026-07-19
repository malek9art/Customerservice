import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum HotelGuestType {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
}

export class HotelGuestDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Ali' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: HotelGuestType, example: HotelGuestType.ADULT })
  @IsEnum(HotelGuestType)
  type: HotelGuestType;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'guest@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateHotelBookingDto {
  @ApiProperty({ example: 'cust-1' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'TRAVELOS_HOTELS' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'hotel-offer-JEDDAH-GRAND-2026-09-10-2026-09-15' })
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @ApiProperty({ example: 'GRAND-DELUXE' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ type: [HotelGuestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HotelGuestDto)
  guests: HotelGuestDto[];
}
