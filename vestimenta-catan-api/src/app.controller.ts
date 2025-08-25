import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  redirectToSwagger(@Res() res: Response): void {
    res.redirect('/api');
  }
}

@Controller()
export class ApiController {
  @Get('api')
  @ApiExcludeEndpoint()
  redirectToSwaggerDocs(@Res() res: Response): void {
    res.redirect('/api/docs');
  }

  @Get('api/health')
  @ApiExcludeEndpoint()
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Vestimenta Catán API',
      version: '1.0.0',
    };
  }
}
