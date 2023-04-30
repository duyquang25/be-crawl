import { HttpException, HttpStatus } from '@nestjs/common';

export function ApiError(code = '', message: any, httpCode: HttpStatus = HttpStatus.BAD_REQUEST) {
  return new HttpException(
    {
      code,
      message,
    },
    httpCode,
  );
}
