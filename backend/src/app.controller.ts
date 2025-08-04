import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

class WelcomeResponseDto {
  message: string;
}

class HealthResponseDto {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Welcome message',
    description:
      'Get a welcome message from the Plink Logistics Courier Service API',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message retrieved successfully',
    type: WelcomeResponseDto,
    example: {
      message: 'Welcome to Plink Logistics Courier Service API!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check the health status of the API service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status retrieved successfully',
    type: HealthResponseDto,
    example: {
      status: 'ok',
      timestamp: '2024-01-01T12:00:00.000Z',
      service: 'Plink Logistics Courier Service API',
      version: '1.0.0',
    },
  })
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Plink Logistics Courier Service API',
      version: '1.0.0',
    };
  }
}
