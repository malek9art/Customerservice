import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class EvaluateRuleDto {
  @ApiProperty({ example: 'PACKAGE_PRICING' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  data: Record<string, unknown>;
}

export class AiChatDto {
  @ApiProperty({ example: 'Show today operations summary' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
