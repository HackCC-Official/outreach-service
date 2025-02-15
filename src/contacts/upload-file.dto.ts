/*
 * DTO for uploading a CSV file.
 */
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CSV file to upload',
  })
  file!: Buffer;
}
