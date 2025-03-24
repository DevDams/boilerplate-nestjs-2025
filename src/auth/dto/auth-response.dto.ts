import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../database/users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'The authenticated user',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class MagicLinkResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Magic link sent to your email',
  })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset instructions sent to your email',
  })
  message: string;
} 