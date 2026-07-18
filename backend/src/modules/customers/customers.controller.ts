import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Customers CRM')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async create(@CurrentCompany() companyId: string, @Body() data: any) {
    return this.customersService.create(companyId, data);
  }

  @Get('search')
  @ApiOperation({ summary: 'Smart search for customers' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async search(@CurrentCompany() companyId: string, @Query('q') query: string) {
    return this.customersService.smartSearch(companyId, query);
  }

  @Get(':id/360')
  @ApiOperation({ summary: 'Get Customer 360 View' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async get360(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.customersService.getCustomer360(companyId, id);
  }

  @Post(':id/passport')
  @ApiOperation({ summary: 'Upload and OCR passport' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPassport(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.customersService.uploadPassport(
      companyId,
      id,
      file.buffer,
      file.originalname,
    );
  }
}
