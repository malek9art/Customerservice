import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PassportStatus {
  WITH_CUSTOMER = 'WITH_CUSTOMER',
  RECEIVED_BY_AGENCY = 'RECEIVED_BY_AGENCY',
  IN_SAFE = 'IN_SAFE',
  SUBMITTED_TO_EMBASSY = 'SUBMITTED_TO_EMBASSY',
  RECEIVED_FROM_EMBASSY = 'RECEIVED_FROM_EMBASSY',
  READY_FOR_COLLECTION = 'READY_FOR_COLLECTION',
  DELIVERED_TO_CUSTOMER = 'DELIVERED_TO_CUSTOMER',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
}

export class UpdatePassportStatusDto {
  @ApiProperty({ enum: PassportStatus, example: PassportStatus.IN_SAFE })
  @IsEnum(PassportStatus)
  status: PassportStatus;

  @ApiProperty({ example: 'Safe 02 - Shelf B' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: 'emp-101',
    description: 'ID of the employee performing the status update',
  })
  @IsString()
  @IsNotEmpty()
  actorId: string;

  @ApiPropertyOptional({ example: 'Moved to physical safe location' })
  @IsOptional()
  @IsString()
  notes?: string;
}
