import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { DocumentIntelligenceService } from './document-intelligence.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Document Intelligence')
@Controller('documents')
export class DocumentIntelligenceController {
  constructor(private readonly docService: DocumentIntelligenceService) {}

  @Post('vault')
  @ApiOperation({ summary: 'Securely upload and process a document with AI' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentCompany() companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { customerId?: string; type: string; tags?: string },
  ) {
    const tags = body.tags ? body.tags.split(',') : [];
    return this.docService.processAndVault(
      companyId,
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        ...body,
        tags,
      },
    );
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get document versioning and activity timeline' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getTimeline(@Param('id') id: string) {
    return this.docService.getDocumentTimeline(id);
  }

  @Get('intelligence-search')
  @ApiOperation({ summary: 'Semantic search inside document content' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async search(@CurrentCompany() companyId: string, @Query('q') query: string) {
    return this.docService.searchInsideDocuments(companyId, query);
  }
}
