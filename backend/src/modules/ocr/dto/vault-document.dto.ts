import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VaultDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiProperty({ example: 'PASSPORT' }) @IsString() @IsNotEmpty() type: string;
  @ApiPropertyOptional({ example: 'visa,urgent' })
  @IsOptional()
  @IsString()
  tags?: string;
  @ApiProperty({ type: 'string', format: 'binary' }) file: unknown;
}
