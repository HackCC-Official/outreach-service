import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InterestedUsersService } from './interested-users.service';
import { InterestedUserDto } from './dto/interested-user.dto';
import { CreateInterestedUserDto } from './dto/create-interested-user.dto';
import { plainToInstance } from 'class-transformer';

/**
 * Controller handling interested users endpoints
 */
@ApiTags('Interested Users')
@Controller('interested-users')
export class InterestedUsersController {
  public constructor(
    private readonly interestedUsersService: InterestedUsersService,
  ) {}

  /**
   * Creates a new interested user
   * @param createInterestedUserDto - The data for creating a new interested user
   * @returns The created interested user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new interested user' })
  @ApiBody({ type: CreateInterestedUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The interested user has been successfully created',
    type: InterestedUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
  })
  public async create(
    @Body() createInterestedUserDto: CreateInterestedUserDto,
  ): Promise<InterestedUserDto> {
    const user = await this.interestedUsersService.create(
      createInterestedUserDto,
    );
    return plainToInstance(InterestedUserDto, user);
  }

  /**
   * Retrieves all interested users
   * @returns Array of interested users
   */
  @Get()
  @ApiOperation({ summary: 'Get all interested users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all interested users',
    type: [InterestedUserDto],
  })
  public async findAll(): Promise<InterestedUserDto[]> {
    const users = await this.interestedUsersService.findAll();
    return users.map((user) => plainToInstance(InterestedUserDto, user));
  }

  /**
   * Retrieves a specific interested user by ID
   * @param id - The UUID of the interested user
   * @returns The interested user if found
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an interested user by ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the interested user',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The interested user has been found',
    type: InterestedUserDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interested user not found',
  })
  public async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InterestedUserDto> {
    const user = await this.interestedUsersService.findOne(id);
    return plainToInstance(InterestedUserDto, user);
  }

  /**
   * Deletes an interested user by ID
   * @param id - The UUID of the interested user to delete
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an interested user' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the interested user to delete',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The interested user has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interested user not found',
  })
  public async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.interestedUsersService.remove(id);
  }
}
