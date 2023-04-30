import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({ example: 'E0' })
  public code: unknown;

  @ApiProperty({ example: 'Error' })
  public message: string;

  @ApiProperty()
  public errors: unknown;

  public async error(code: unknown, message: string, errors: unknown) {
    this.message = message;
    this.code = code;
    this.errors = errors;
    return this;
  }
}

export class HttpError extends ApiErrorResponse {
  @ApiProperty({ type: String })
  message: string;

  public static error(code: unknown, message: string, errors: any) {
    const result = new HttpError();
    result.error(code, message, errors);

    return result;
  }
}
