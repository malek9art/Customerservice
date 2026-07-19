import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class InvoiceItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty({ example: 1 }) @Type(() => Number) @IsNumber() @Min(0.01) quantity: number;
  @ApiProperty({ example: 500 }) @Type(() => Number) @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceId?: string;
}
export class CreateInvoiceDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId: string;
  @ApiProperty({ type: [InvoiceItemDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => InvoiceItemDto) items: InvoiceItemDto[];
  @ApiPropertyOptional({ example: 15 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxRate?: number;
  @ApiPropertyOptional({ example: 50 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
}
export class RecordPaymentDto {
  @ApiProperty({ example: 500 }) @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
  @ApiProperty({ enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'WALLET'] }) @IsIn(['CASH', 'BANK_TRANSFER', 'CARD', 'WALLET']) method: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transactionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
