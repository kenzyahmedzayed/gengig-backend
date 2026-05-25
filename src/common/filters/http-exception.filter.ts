import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from 'express'; 
import { timestamp } from "rxjs";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';

        if (exception instanceof HttpException){
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' && 'message' in (res as object)
            ? (res as any).message
            : exception.message;
        } else {
            this.logger.error('Unhandled exception', exception);
        }
    response.status(status).json({
    statusCode: status, 
    message,
    timestamp: new Date().toISOString(),
    path: request.url,
});
 }
}





