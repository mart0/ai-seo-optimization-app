import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';

@ObjectType()
export class MessageType {
  @Field(() => ID)
  id: string;

  @Field()
  role: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ConversationType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => [MessageType])
  messages: MessageType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class SendMessageInput {
  @Field({ nullable: true })
  conversationId?: string;

  @Field()
  content: string;
}

@ObjectType()
export class SendMessageResponse {
  @Field(() => MessageType)
  message: MessageType;

  @Field(() => ConversationType)
  conversation: ConversationType;
}
