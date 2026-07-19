import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
}
