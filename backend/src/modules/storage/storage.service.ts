import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {}

  async uploadFile(
    companyId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    isPrivate = true,
  ) {
    const fileKey = `${companyId}/${isPrivate ? 'private' : 'public'}/${uuidv4()}-${fileName}`;
    this.logger.log(`Uploading file: ${fileKey}`);

    return {
      id: uuidv4(),
      key: fileKey,
      url: `data:${mimeType};base64,${file.toString('base64')}`,
      versionId: '1',
    };
  }
}
