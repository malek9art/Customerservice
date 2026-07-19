import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVisaApplicationDto {
  @ApiProperty({ example: 'cust-1' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'SA', description: 'Destination country code' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'UMRAH' })
  @IsString()
  @IsNotEmpty()
  visaType: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fee?: number;
}
