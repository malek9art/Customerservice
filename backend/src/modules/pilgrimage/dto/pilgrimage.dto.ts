import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class PilgrimDto {
  @ApiProperty({ example: 'Ahmed Ali' }) @IsString() @IsNotEmpty() fullName: string;
  @ApiProperty({ enum: ['MALE', 'FEMALE'] }) @IsIn(['MALE', 'FEMALE']) gender: string;
  @ApiPropertyOptional() @IsOptional() @IsString() passportNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medicalInfo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
}
export class CreatePilgrimageBookingDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId: string;
  @ApiProperty() @IsString() @IsNotEmpty() packageId: string;
  @ApiProperty({ type: [PilgrimDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => PilgrimDto) pilgrims: PilgrimDto[];
}
export class ModifyPilgrimageBookingDto {
  @ApiPropertyOptional({ enum: ['CONFIRMED', 'ON_HOLD'] }) @IsOptional() @IsIn(['CONFIRMED', 'ON_HOLD']) status?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) paidAmount?: number;
}
export class CancelPilgrimageBookingDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}
export class RoomAllocationDto {
  @ApiProperty() @IsString() @IsNotEmpty() packageId: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxRoomCapacity?: number;
}
export class BusAllocationDto {
  @ApiProperty() @IsString() @IsNotEmpty() packageId: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) busCapacity?: number;
}
export class GroupAllocationDto {
  @ApiProperty() @IsString() @IsNotEmpty() pilgrimId: string;
  @ApiProperty() @IsString() @IsNotEmpty() groupId: string;
}
