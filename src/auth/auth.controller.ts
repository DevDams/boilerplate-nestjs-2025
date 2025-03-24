import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  Get, 
  UnauthorizedException,
  BadRequestException,
  HttpStatus
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, MagicLinkResponseDto, ResetPasswordResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/guards/global-auth.guard';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiUnauthorizedResponse, 
  ApiBadRequestResponse,
  ApiBody
} from '@nestjs/swagger';
import { UserResponseDto } from '../database/users/dto/user-response.dto';
import { RateLimit } from './decorators/throttle.decorator';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(ConfigService) private configService: ConfigService
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @RateLimit(5, 60) // 5 requests per minute
  @ApiOperation({ summary: 'Login with email and password', description: 'Authenticates a user and returns tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User successfully logged in',
    type: AuthResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @RateLimit(3, 300) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Register new user', description: 'Creates a new user account' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User successfully registered',
    type: AuthResponseDto
  })
  @ApiBadRequestResponse({ description: 'Invalid input or email already in use' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('magic-link')
  @RateLimit(3, 300) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Request magic link', description: 'Sends a magic link to the provided email for passwordless login' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Magic link sent successfully',
    type: MagicLinkResponseDto
  })
  async requestMagicLink(@Body() magicLinkDto: MagicLinkDto) {
    return this.authService.sendMagicLink(magicLinkDto.email);
  }

  @Public()
  @Post('verify-magic-link')
  @ApiOperation({ summary: 'Verify magic link', description: 'Verifies a magic link token and authenticates the user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Magic link verified successfully',
    type: AuthResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async verifyMagicLink(@Body() verifyMagicLinkDto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(
      verifyMagicLinkDto.email,
      verifyMagicLinkDto.token
    );
  }

  @Public()
  @Post('forgot-password')
  @RateLimit(3, 300) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Forgot password', description: 'Sends a password reset link to the provided email' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password reset instructions sent',
    type: ResetPasswordResponseDto
  })
  async forgotPassword(@Body() magicLinkDto: MagicLinkDto) {
    return this.authService.forgotPassword(magicLinkDto.email);
  }

  @Public()
  @Post('reset-password')
  @RateLimit(3, 300) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Reset password', description: 'Resets the user password using a token' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password reset successfully',
    type: AuthResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.token,
      resetPasswordDto.password
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile', description: 'Returns the profile of the authenticated user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User profile retrieved successfully',
    type: UserResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Post('refresh-token')
  @RateLimit(10, 60) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh token', description: 'Gets a new access token using a refresh token' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token refreshed successfully',
    type: AuthResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @ApiBadRequestResponse({ description: 'Missing required fields' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.userId || !refreshTokenDto.refreshToken) {
      throw new BadRequestException('User ID and refresh token are required');
    }
    
    return this.authService.refreshToken(refreshTokenDto.userId, refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout user', description: 'Invalidates the refresh token for the user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User successfully logged out',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  })
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }
} 