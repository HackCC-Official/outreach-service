import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseFilters,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { Contact } from './contacts.entity';
import { CreateContactDto, UpdateContactDto } from './contacts.dto';
import { ContactsExceptionFilter } from './contacts.exceptions';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from './upload-file.dto';

@ApiTags('Contacts')
@Controller('contacts')
@UseFilters(ContactsExceptionFilter)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The contact has been successfully created.',
    type: Contact,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Contact with this email already exists.',
  })
  create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return this.contactsService.create(createContactDto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload contacts from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file to upload',
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ createdContacts: Contact[]; errors: string[] }> {
    if (!file || typeof file !== 'object') {
      throw new BadRequestException('Invalid file upload');
    }
    const uploadedFile = file as { buffer: Buffer };
    return await this.contactsService.uploadContacts(uploadedFile.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns an array of contacts and total count',
    type: [Contact],
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ): Promise<{ data: Contact[]; total: number }> {
    const [data, total] = await this.contactsService.findAll(skip, take);
    return { data, total };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search contacts by name, email, or company' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns an array of matching contacts',
    type: [Contact],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search query',
  })
  search(@Query('query') query: string): Promise<Contact[]> {
    return this.contactsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Contact ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the contact',
    type: Contact,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Contact> {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'id', required: true, description: 'Contact ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The contact has been successfully updated.',
    type: Contact,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Contact with this email already exists.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'id', required: true, description: 'Contact ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The contact has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.contactsService.remove(id);
  }
}
