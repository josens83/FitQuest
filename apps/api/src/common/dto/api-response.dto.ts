import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'Response status', example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Timestamp' })
  timestamp?: string;

  constructor(success: boolean, data?: T, message?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message);
  }

  static error(message: string): ApiResponseDto<null> {
    return new ApiResponseDto(false, null, message);
  }
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Error message', example: 'Bad Request' })
  message: string;

  @ApiPropertyOptional({ description: 'Error type', example: 'ValidationError' })
  error?: string;

  @ApiPropertyOptional({ description: 'Detailed errors', isArray: true })
  errors?: ErrorDetail[];

  @ApiProperty({ description: 'Timestamp', example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ description: 'Request path', example: '/api/users' })
  path: string;

  @ApiPropertyOptional({ description: 'Request ID for tracking' })
  requestId?: string;
}

export class ErrorDetail {
  @ApiProperty({ description: 'Field name', example: 'email' })
  field: string;

  @ApiProperty({ description: 'Error message', example: 'Invalid email format' })
  message: string;

  @ApiPropertyOptional({ description: 'Error code', example: 'INVALID_EMAIL' })
  code?: string;
}

export class SuccessResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean = true;

  @ApiProperty({ description: 'Success message' })
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class DeleteResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean = true;

  @ApiProperty({ description: 'Deleted resource ID' })
  id: string;

  @ApiProperty({ description: 'Deletion message', example: 'Resource deleted successfully' })
  message: string = 'Resource deleted successfully';

  constructor(id: string) {
    this.id = id;
  }
}
