import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;
  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceId?: string;
}
export class CreateInvoiceDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId: string;
  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
}
export class RecordPaymentDto {
  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;
  @ApiProperty({ enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'WALLET'] })
  @IsIn(['CASH', 'BANK_TRANSFER', 'CARD', 'WALLET'])
  method: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transactionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class BankTransactionDto {
  @ApiProperty() @IsString() @IsNotEmpty() bankReference: string;
  @ApiProperty() @IsString() @IsNotEmpty() senderName: string;
  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;
  @ApiProperty() @IsDateString() transactionDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentReference?: string;
}

export class BankStatementDto {
  @ApiProperty() @IsString() @IsNotEmpty() bankName: string;
  @ApiProperty() @IsString() @IsNotEmpty() accountNumber: string;
  @ApiProperty({ type: [BankTransactionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BankTransactionDto)
  transactions: BankTransactionDto[];
}

export class ConfirmMatchDto {
  @ApiProperty() @IsString() @IsNotEmpty() bankReference: string;
  @ApiProperty()
  @IsIn(['INVOICE', 'PILGRIMAGE_BOOKING', 'FLIGHT_BOOKING', 'HOTEL_BOOKING'])
  targetType: string;
  @ApiProperty() @IsString() @IsNotEmpty() targetId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
}

export class PostAccountingEventDto {
  @ApiProperty() @IsString() @IsNotEmpty() eventType: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  payload: Record<string, unknown>;
}
