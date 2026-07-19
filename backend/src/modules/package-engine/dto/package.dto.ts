import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreatePackageDto {
  @ApiProperty({ example: 'Umrah Ramadan 1447' }) @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ enum: ['HAJJ', 'UMRAH', 'TOURISM', 'SPECIAL'] }) @IsIn(['HAJJ', 'UMRAH', 'TOURISM', 'SPECIAL']) type: string;
  @ApiPropertyOptional({ example: '1447H' }) @IsOptional() @IsString() season?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: '2026-09-10' }) @IsDateString() startDate: string;
  @ApiProperty({ example: '2026-09-20' }) @IsDateString() endDate: string;
  @ApiProperty({ example: 2500 }) @Type(() => Number) @IsNumber() @Min(0) basePrice: number;
  @ApiProperty({ example: 'USD' }) @IsString() @IsNotEmpty() currency: string;
  @ApiProperty({ example: 40 }) @Type(() => Number) @IsInt() @Min(1) capacity: number;
  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE'], default: 'DRAFT' }) @IsOptional() @IsIn(['DRAFT', 'ACTIVE']) status?: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) @IsOptional() @IsObject() flights?: Record<string, unknown>;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) @IsOptional() @IsObject() hotels?: Record<string, unknown>;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) @IsOptional() @IsObject() transportation?: Record<string, unknown>;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}

export class UpdatePackageCapacityDto {
  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;
}
