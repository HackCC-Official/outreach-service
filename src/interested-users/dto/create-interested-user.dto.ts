import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new interested user
 */
export class CreateInterestedUserDto {
  @ApiProperty({
    description: 'Email address of the interested user',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  public email!: string;
}
