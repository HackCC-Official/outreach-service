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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { OutreachTeamService } from './outreach-team.service';
import { OutreachTeam } from './outreach-team.entity';
import {
  CreateOutreachTeamDto,
  UpdateOutreachTeamDto,
} from './outreach-team.dto';
import { ContactsExceptionFilter } from '../contacts/contacts.exceptions';

@ApiTags('Outreach Team')
@Controller('outreach-team')
@UseFilters(ContactsExceptionFilter)
export class OutreachTeamController {
  constructor(private readonly outreachTeamService: OutreachTeamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team member' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The team member has been successfully created.',
    type: OutreachTeam,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Team member with this email already exists.',
  })
  create(
    @Body() createOutreachTeamDto: CreateOutreachTeamDto,
  ): Promise<OutreachTeam> {
    return this.outreachTeamService.create(createOutreachTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all team members with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns an array of team members and total count',
    type: [OutreachTeam],
  })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ): Promise<{ data: OutreachTeam[]; total: number }> {
    const [data, total] = await this.outreachTeamService.findAll(skip, take);
    return { data, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team member by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Team Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the team member',
    type: OutreachTeam,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team member not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OutreachTeam> {
    return this.outreachTeamService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a team member' })
  @ApiParam({ name: 'id', required: true, description: 'Team Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The team member has been successfully updated.',
    type: OutreachTeam,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team member not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Team member with this email already exists.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOutreachTeamDto: UpdateOutreachTeamDto,
  ): Promise<OutreachTeam> {
    return this.outreachTeamService.update(id, updateOutreachTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team member' })
  @ApiParam({ name: 'id', required: true, description: 'Team Member ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The team member has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team member not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.outreachTeamService.remove(id);
  }
}
