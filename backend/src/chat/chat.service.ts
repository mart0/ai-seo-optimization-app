import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { UserService } from '../user/user.service';
import { SeoAgentService } from '../seo-agent/seo-agent.service';
import { JwtPayload } from '../auth/current-user.decorator';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly userService: UserService,
    private readonly seoAgentService: SeoAgentService,
  ) {}

  async getUserConversations(jwtPayload: JwtPayload): Promise<Conversation[]> {
    const user = await this.userService.findOrCreate(
      jwtPayload.sub,
      jwtPayload.email,
      jwtPayload.name,
    );

    return this.conversationRepo.find({
      where: { user: { id: user.id } },
      relations: ['messages'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getConversation(id: string, jwtPayload: JwtPayload): Promise<Conversation> {
    const user = await this.userService.findOrCreate(jwtPayload.sub);

    const conversation = await this.conversationRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(
    content: string,
    conversationId: string | undefined,
    jwtPayload: JwtPayload,
  ): Promise<{ message: Message; conversation: Conversation }> {
    const user = await this.userService.findOrCreate(
      jwtPayload.sub,
      jwtPayload.email,
      jwtPayload.name,
    );

    let conversation: Conversation;

    if (conversationId) {
      const found = await this.conversationRepo.findOne({
        where: { id: conversationId, user: { id: user.id } },
        relations: ['messages'],
      });
      if (!found) {
        throw new NotFoundException('Conversation not found');
      }
      conversation = found;
    } else {
      const title = content.length > 50 ? content.slice(0, 47) + '...' : content;
      conversation = this.conversationRepo.create({ user, title });
      await this.conversationRepo.save(conversation);
      conversation.messages = [];
    }

    const userMessage = this.messageRepo.create({
      conversation,
      role: 'user',
      content,
    });
    await this.messageRepo.save(userMessage);

    const history = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      order: { createdAt: 'ASC' },
    });

    const aiResponse = await this.seoAgentService.analyze(content, history);

    const assistantMessage = this.messageRepo.create({
      conversation,
      role: 'assistant',
      content: aiResponse,
    });
    await this.messageRepo.save(assistantMessage);

    const updatedConversation = await this.conversationRepo.findOne({
      where: { id: conversation.id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    return { message: assistantMessage, conversation: updatedConversation! };
  }

  async deleteConversation(id: string, jwtPayload: JwtPayload): Promise<boolean> {
    const user = await this.userService.findOrCreate(jwtPayload.sub);

    const conversation = await this.conversationRepo.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.conversationRepo.remove(conversation);
    return true;
  }
}
