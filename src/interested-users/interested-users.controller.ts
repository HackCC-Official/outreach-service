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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InterestedUsersService } from './interested-users.service';
import { InterestedUserDto } from './dto/interested-user.dto';
import { CreateInterestedUserDto } from './dto/create-interested-user.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountRoles } from '../auth/role.enum';
import { InterestedUsersThrottlerGuard } from './throttler.guard';

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
   * This endpoint is publicly accessible but rate-limited by IP address to prevent abuse
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
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description:
      'Too many requests from this IP address, please try again later',
  })
  @UseGuards(InterestedUsersThrottlerGuard)
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
  @ApiBearerAuth('access-token')
  @Roles([AccountRoles.ORGANIZER])
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
    name: 'email',
    description: 'The email of the interested user to delete',
    type: 'string',
    format: 'email@example.com',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The interested user has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interested user not found',
  })
  @UseGuards(InterestedUsersThrottlerGuard)
  public async remove(
    @Param('email', ParseUUIDPipe) email: string,
  ): Promise<void> {
    await this.interestedUsersService.remove(email);
  }
}
