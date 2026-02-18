import { Module } from '@nestjs/common';
import { SeoAgentService } from './seo-agent.service';

@Module({
  providers: [SeoAgentService],
  exports: [SeoAgentService],
})
export class SeoAgentModule {}
