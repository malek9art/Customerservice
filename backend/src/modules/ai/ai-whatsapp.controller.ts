import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Conversational AI (WhatsApp)')
@Controller('ai/whatsapp')
export class AiWhatsappController {
  constructor(private readonly aiService: AiAgentService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp Cloud API Webhook' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async webhook(@CurrentCompany() companyId: string, @Body() body: any) {
    // Note: In real production, x-company-id would be derived from the WhatsApp phone number in the payload
    return this.aiService.handleIncomingMessage(companyId, body);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get AI conversation session details' })
  async getSession(@Param('id') id: string) {
    // Logic to return session with messages and AI logs
  }
}
