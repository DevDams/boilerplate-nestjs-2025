import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/guards/global-auth.guard';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Check system health', description: 'Verifies API health and security configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System is healthy with all security configurations in place',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: '1.0.0' },
        securityHeaders: {
          type: 'object',
          properties: {
            contentSecurityPolicy: { type: 'boolean' },
            xContentTypeOptions: { type: 'boolean' },
            xFrameOptions: { type: 'boolean' },
            xssProtection: { type: 'boolean' },
          }
        }
      }
    }
  })
  healthCheck(@Req() req: Request, @Res() res: Response) {
    // Get the response headers to check security headers
    const headers = req.headers;

    // Check security headers
    const securityHeaders = {
      contentSecurityPolicy: !!headers['content-security-policy'],
      xContentTypeOptions: headers['x-content-type-options'] === 'nosniff',
      xFrameOptions: !!headers['x-frame-options'],
      xssProtection: !!headers['x-xss-protection'],
    };

    // Build health response
    const healthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      securityHeaders,
    };

    return res.status(HttpStatus.OK).json(healthResponse);
  }
}
