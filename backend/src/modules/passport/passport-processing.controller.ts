import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PassportProcessingService } from './passport-processing.service';
import { ReceivePassportDto } from './dto/receive-passport.dto';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Passport Processing')
@Controller('passports')
export class PassportProcessingController {
  constructor(private readonly passportService: PassportProcessingService) {}

  @Post('receive')
  @ApiOperation({ summary: 'Log a passport into the agency inventory' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async receive(
    @CurrentCompany() companyId: string,
    @Body() data: ReceivePassportDto,
  ) {
    return this.passportService.receivePassport(companyId, data);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get current passport inventory' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getInventory(@CurrentCompany() companyId: string) {
    return this.passportService.getInventory(companyId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update passport status and location' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async updateStatus(
    @Param('id') id: string,
    @Body()
    body: { status: string; location: string; actorId: string; notes?: string },
  ) {
    return this.passportService.updateLocation(
      id,
      body.location,
      body.status,
      body.actorId,
      body.notes,
    );
  }
}
