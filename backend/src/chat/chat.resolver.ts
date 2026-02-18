import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GqlAuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtPayload } from '../auth/current-user.decorator';
import {
  ConversationType,
  SendMessageInput,
  SendMessageResponse,
} from './dto/chat.types';

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [ConversationType])
  async conversations(
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationType[]> {
    return this.chatService.getUserConversations(user);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => ConversationType)
  async conversation(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationType> {
    return this.chatService.getConversation(id, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => SendMessageResponse)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<SendMessageResponse> {
    return this.chatService.sendMessage(
      input.content,
      input.conversationId,
      user,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteConversation(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.chatService.deleteConversation(id, user);
  }
}
