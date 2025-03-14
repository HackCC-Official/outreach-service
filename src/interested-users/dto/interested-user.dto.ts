import { IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InterestedUserDto {
  @ApiProperty({
    description: 'Unique identifier of the interested user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  public id!: string;

  @ApiProperty({
    description: 'Email address of the interested user',
    example: 'user@example.com',
  })
  @IsEmail()
  public email!: string;

  @ApiProperty({
    description: 'Timestamp when the user expressed interest',
    example: '2024-02-24T12:00:00.000Z',
  })
  public created_at!: Date;
}
