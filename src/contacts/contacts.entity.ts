import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';

@Entity('contacts')
export class Contact {
  @ApiProperty({
    description: 'The unique identifier of the contact',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The full name of the contact',
    example: 'John Doe',
  })
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The company where the contact works',
    example: 'Acme Corporation',
  })
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  company: string;

  @ApiProperty({
    description: 'The role/position of the contact',
    example: 'Software Engineer',
  })
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'The phone number of the contact',
    example: '+1234567890',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  phone: string;

  @ApiProperty({
    description: 'The LinkedIn profile URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsUrl()
  @IsOptional()
  linkedin: string;

  @ApiProperty({
    description: 'Additional notes about the contact',
    example: 'Met at tech conference',
  })
  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  notes: string;

  @ApiProperty({
    description: 'The timestamp when the contact was created',
  })
  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The timestamp when the contact was last updated',
  })
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
  })
  updatedAt: Date;
}
