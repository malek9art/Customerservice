import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelHotelBookingDto {
  @ApiProperty({ example: 'Customer requested cancellation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
