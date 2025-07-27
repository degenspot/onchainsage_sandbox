import { Module } from '@nestjs/common';
import { ApiDocsController } from './api-docs.controller';
import { ApiDocsService } from './api-docs.service';

@Module({
  controllers: [ApiDocsController],
  providers: [ApiDocsService],
  exports: [ApiDocsService],
})
export class ApiDocsModule {}