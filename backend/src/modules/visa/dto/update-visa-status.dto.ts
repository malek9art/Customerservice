import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateVisaStatusDto {
  @ApiProperty({
    enum: [
      'DRAFT',
      'SUBMITTED',
      'PROCESSING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
    ],
  })
  @IsIn([
    'DRAFT',
    'SUBMITTED',
    'PROCESSING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
  ])
  status: string;

  @ApiProperty({ example: 'emp-101' })
  @IsString()
  @IsNotEmpty()
  actorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
