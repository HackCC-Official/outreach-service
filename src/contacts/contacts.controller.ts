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
  UseGuards,
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
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountRoles } from '../auth/role.enum';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'The CSV file has been accepted for processing.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'CSV upload started. Contacts will be processed in the background.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file upload',
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  @HttpCode(HttpStatus.ACCEPTED)
  upload(@UploadedFile() file: Express.Multer.File): { message: string } {
    if (!file || typeof file !== 'object') {
      throw new BadRequestException('Invalid file upload');
    }
    const uploadedFile = file as { buffer: Buffer };

    this.contactsService.processContactsUpload(uploadedFile.buffer);

    return {
      message:
        'CSV upload started. Contacts will be processed in the background.',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all contacts with pagination',
    description:
      'Endpoint accepts page-based pagination. Example: /outreach-service/contacts?page=3&limit=100',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns an array of contacts and pagination information',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Contact' },
        },
        total: {
          type: 'number',
          description: 'Total number of contacts',
          example: 100,
        },
        page: {
          type: 'number',
          description: 'Current page',
          example: 3,
        },
        pageCount: {
          type: 'number',
          description: 'Total number of pages',
          example: 10,
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          example: 10,
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<{
    data: Contact[];
    total: number;
    page: number;
    pageCount: number;
    limit: number;
  }> {
    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = limit && limit > 0 ? limit : 10;

    const skip = (currentPage - 1) * itemsPerPage;

    const [data, total] = await this.contactsService.findAll(
      skip,
      itemsPerPage,
    );

    const pageCount = Math.ceil(total / itemsPerPage);

    return {
      data,
      total,
      page: currentPage,
      pageCount,
      limit: itemsPerPage,
    };
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
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.contactsService.remove(id);
  }
}
