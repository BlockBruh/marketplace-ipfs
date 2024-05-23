import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PinataConstants } from '../../ipfs/util/constants';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const correlationId = context
      .switchToRpc()
      .getContext()
      .get(PinataConstants.CORRELATION_ID)[0];
    this.logger.log(
      'Request: ' + JSON.stringify(context.switchToRpc().getData()),
      correlationId,
    );

    return next.handle().pipe(
      tap((response) => {
        this.logger.log('Response: ' + JSON.stringify(response), correlationId);
      }),
    );
  }
}
