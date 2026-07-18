import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { BreService } from './modules/bre/bre.service';
import { AiOrchestrator } from './modules/ai/ai-orchestrator.service';
import { CurrentCompany } from './common/decorators/current-company.decorator';

@ApiTags('Core Foundation')
@Controller('core')
export class CoreController {
  constructor(
    private bre: BreService,
    private ai: AiOrchestrator,
  ) {}

  @Post('evaluate-rule')
  @ApiOperation({ summary: 'Evaluate a business rule' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async evaluateRule(
    @CurrentCompany() companyId: string,
    @Body() body: { type: string; data: any },
  ) {
    return this.bre.evaluate(companyId, body.type, body.data);
  }

  @Post('ai-chat')
  @ApiOperation({ summary: 'Process AI chat message' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async aiChat(
    @CurrentCompany() companyId: string,
    @Body() body: { message: string },
  ) {
    return this.ai.process(body.message, { companyId });
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
