import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { UserModule } from '../user/user.module';
import { SeoAgentModule } from '../seo-agent/seo-agent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    UserModule,
    SeoAgentModule,
  ],
  providers: [ChatService, ChatResolver],
})
export class ChatModule {}
