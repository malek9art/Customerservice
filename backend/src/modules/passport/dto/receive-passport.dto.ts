import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReceivePassportDto {
  @ApiProperty({ example: 'cust-1' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'PASS-778899' })
  @IsString()
  @IsNotEmpty()
  passportNumber: string;

  @ApiProperty({
    example: 'emp-101',
    description: 'ID of the employee who received the passport',
  })
  @IsString()
  @IsNotEmpty()
  receivedById: string;

  @ApiPropertyOptional({ example: 'Intake desk' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;
}
