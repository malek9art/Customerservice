import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { WhatsappWebhookDto } from './dto/whatsapp-webhook.dto';

@ApiTags('Conversational AI (WhatsApp)')
@Controller('ai/whatsapp')
export class AiWhatsappController {
  constructor(private readonly aiService: AiAgentService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp Cloud API Webhook' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async webhook(
    @CurrentCompany() companyId: string,
    @Body() body: WhatsappWebhookDto,
  ) {
    return this.aiService.handleIncomingMessage(companyId, body);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get AI conversation session details' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getSession(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.getSession(companyId, id);
  }
}
