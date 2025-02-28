import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsIn } from 'class-validator';

export class CreateOutreachTeamDto {
  @ApiProperty({
    description: 'The email address of the team member',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'The full name of the team member',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'The major of the team member',
    example: 'Computer Science',
  })
  @IsString()
  @IsNotEmpty({ message: 'Major is required' })
  major: string;

  @ApiProperty({
    description: 'The academic year of the team member',
    example: 'Sophomore',
  })
  @IsString()
  @IsNotEmpty({ message: 'Year is required' })
  @IsIn(['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'], {
    message:
      'Invalid year. Must be one of: Freshman, Sophomore, Junior, Senior, Graduate',
  })
  year: string;

  @ApiProperty({
    description: 'The school of the team member',
    example: 'University of California, Berkeley',
  })
  @IsString()
  @IsNotEmpty({ message: 'School is required' })
  school: string;
}

export class UpdateOutreachTeamDto extends PartialType(CreateOutreachTeamDto) {}
