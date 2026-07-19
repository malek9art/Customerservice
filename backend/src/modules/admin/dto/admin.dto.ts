import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreateAdminUserDto {
  @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @IsNotEmpty() role: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
export class UpdateAdminUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateSystemSettingsDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  settings: Record<string, unknown>;
}
