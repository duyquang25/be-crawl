import { Logger } from '@nestjs/common';

export class Utils {
  private static readonly logger = new Logger(Utils.name);
}
