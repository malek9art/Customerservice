import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WhatsappWebhookDto {
  @ApiProperty({ example: '+967771234567' })
  @IsString()
  @IsNotEmpty()
  from: string;
  @ApiPropertyOptional() @IsOptional() @IsString() text?: string;
  @ApiProperty({ enum: ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO'] })
  @IsIn(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO'])
  type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mediaId?: string;
}
