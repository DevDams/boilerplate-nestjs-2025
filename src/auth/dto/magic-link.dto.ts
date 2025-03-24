import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkDto {
  @ApiProperty({
    description: 'Email address to send the magic link to',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
} 