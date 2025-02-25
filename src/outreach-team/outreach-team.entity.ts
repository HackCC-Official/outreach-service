import { ApiProperty } from '@nestjs/swagger';

export class OutreachTeam {
  @ApiProperty({
    description: 'The unique identifier of the team member',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The email address of the team member',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The full name of the team member',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The major of the team member',
    example: 'Computer Science',
  })
  major: string;

  @ApiProperty({
    description: 'The academic year of the team member',
    example: 'Sophomore',
  })
  year: string;

  @ApiProperty({
    description: 'The school of the team member',
    example: 'University of California, Berkeley',
  })
  school: string;
}
