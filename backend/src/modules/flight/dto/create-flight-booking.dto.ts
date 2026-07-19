import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FlightPassengerDto {
  @ApiProperty({ example: 'AHMED' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'ALI' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateFlightBookingDto {
  @ApiProperty({ example: 'cust-1' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'AMADEUS' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'amadeus-offer-ADE-JED-1' })
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @ApiProperty({ type: [FlightPassengerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FlightPassengerDto)
  passengers: FlightPassengerDto[];
}
