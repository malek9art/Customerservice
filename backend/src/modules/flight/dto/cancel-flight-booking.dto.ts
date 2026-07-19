import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelFlightBookingDto {
  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
