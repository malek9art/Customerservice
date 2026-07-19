import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskAnalyticsDto {
  @ApiProperty({ example: 'What are our best performing services?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;
}
