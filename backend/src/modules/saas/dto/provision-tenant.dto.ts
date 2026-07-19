import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ProvisionTenantDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ example: 'agency-name' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;
  @ApiProperty() @IsEmail() adminEmail: string;
  @ApiProperty() @IsString() @IsNotEmpty() planSlug: string;
}
