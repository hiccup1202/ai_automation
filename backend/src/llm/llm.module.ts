import { Module } from '@nestjs/common';
import { LagLlamaService } from './lag-llama.service';

@Module({
  providers: [LagLlamaService],
  exports: [LagLlamaService],
})
export class LlmModule {}






