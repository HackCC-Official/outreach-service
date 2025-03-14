import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInterestedUserDto {
  @ApiProperty({
    description: 'Email address of the interested user',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  public email!: string;
}
