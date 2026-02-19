import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { UserService } from '../user/user.service';
import { SeoAgentService } from '../seo-agent/seo-agent.service';
import { JwtPayload } from '../auth/current-user.decorator';
import { User } from '../user/user.entity';

const mockJwtPayload: JwtPayload = { sub: 'auth0|user-1', email: 'u@x.com', name: 'User' };

const mockUser: User = {
  id: 'user-1',
  auth0Id: mockJwtPayload.sub,
  email: mockJwtPayload.email ?? '',
  name: mockJwtPayload.name ?? '',
  createdAt: new Date(),
  conversations: [],
};

const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation =>
  ({
    id: 'conv-1',
    title: 'Chat',
    user: mockUser,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Conversation;

const createMockMessage = (overrides: Partial<Message> = {}): Message =>
  ({
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    conversation: null,
    createdAt: new Date(),
    ...overrides,
  }) as Message;

describe('ChatService', () => {
  let service: ChatService;
  let conversationRepo: jest.Mocked<Repository<Conversation>>;
  let messageRepo: jest.Mocked<Repository<Message>>;
  let userService: jest.Mocked<UserService>;
  let seoAgentService: jest.Mocked<SeoAgentService>;

  beforeEach(async () => {
    const mockConvRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    const mockMsgRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Conversation), useValue: mockConvRepo },
        { provide: getRepositoryToken(Message), useValue: mockMsgRepo },
        {
          provide: UserService,
          useValue: { findOrCreate: jest.fn().mockResolvedValue(mockUser) },
        },
        {
          provide: SeoAgentService,
          useValue: { analyze: jest.fn().mockResolvedValue('AI response') },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationRepo = module.get(getRepositoryToken(Conversation)) as jest.Mocked<Repository<Conversation>>;
    messageRepo = module.get(getRepositoryToken(Message)) as jest.Mocked<Repository<Message>>;
    userService = module.get(UserService) as jest.Mocked<UserService>;
    seoAgentService = module.get(SeoAgentService) as jest.Mocked<SeoAgentService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserConversations', () => {
    it('should return user conversations', async () => {
      const convs = [createMockConversation()];
      (conversationRepo.find as jest.Mock).mockResolvedValue(convs);

      const result = await service.getUserConversations(mockJwtPayload);

      expect(userService.findOrCreate).toHaveBeenCalledWith(
        mockJwtPayload.sub,
        mockJwtPayload.email,
        mockJwtPayload.name,
      );
      expect(conversationRepo.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
        relations: ['messages'],
        order: { updatedAt: 'DESC' },
      });
      expect(result).toEqual(convs);
    });
  });

  describe('getConversation', () => {
    it('should return conversation when found', async () => {
      const conv = createMockConversation({ id: 'conv-1' });
      (conversationRepo.findOne as jest.Mock).mockResolvedValue(conv);

      const result = await service.getConversation('conv-1', mockJwtPayload);

      expect(conversationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'conv-1', user: { id: mockUser.id } },
        relations: ['messages'],
        order: { messages: { createdAt: 'ASC' } },
      });
      expect(result).toEqual(conv);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      (conversationRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getConversation('missing', mockJwtPayload)).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage', () => {
    it('should create new conversation and send message when conversationId is undefined', async () => {
      const newConv = createMockConversation({ id: 'new-conv', messages: [] });
      const userMsg = createMockMessage({ role: 'user', content: 'Hi' });
      const assistantMsg = createMockMessage({ role: 'assistant', content: 'AI response' });
      (conversationRepo.create as jest.Mock).mockReturnValue(newConv);
      (conversationRepo.save as jest.Mock).mockResolvedValue(newConv);
      (messageRepo.create as jest.Mock)
        .mockReturnValueOnce(userMsg)
        .mockReturnValueOnce(assistantMsg);
      (messageRepo.save as jest.Mock).mockResolvedValue(undefined);
      (messageRepo.find as jest.Mock).mockResolvedValue([userMsg]);
      (conversationRepo.findOne as jest.Mock).mockResolvedValue({ ...newConv, messages: [userMsg, assistantMsg] });

      const result = await service.sendMessage('Hi', undefined, undefined, mockJwtPayload);

      expect(conversationRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        title: 'Hi',
      });
      expect(conversationRepo.save).toHaveBeenCalledWith(newConv);
      expect(seoAgentService.analyze).toHaveBeenCalledWith('Hi', [userMsg], undefined);
      expect(result.message).toEqual(assistantMsg);
      expect(result.conversation).toBeDefined();
    });

    it('should use existing conversation when conversationId provided', async () => {
      const existingConv = createMockConversation({ id: 'existing' });
      const userMsg = createMockMessage();
      const assistantMsg = createMockMessage({ role: 'assistant' });
      (conversationRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(existingConv)
        .mockResolvedValueOnce({ ...existingConv, messages: [userMsg, assistantMsg] });
      (messageRepo.create as jest.Mock)
        .mockReturnValueOnce(userMsg)
        .mockReturnValueOnce(assistantMsg);
      (messageRepo.save as jest.Mock).mockResolvedValue(undefined);
      (messageRepo.find as jest.Mock).mockResolvedValue([userMsg]);

      const result = await service.sendMessage('Hi', 'existing', 'llama-3', mockJwtPayload);

      expect(conversationRepo.create).not.toHaveBeenCalled();
      expect(seoAgentService.analyze).toHaveBeenCalledWith('Hi', expect.any(Array), 'llama-3');
      expect(result.message).toEqual(assistantMsg);
    });

    it('should throw NotFoundException when conversationId provided but not found', async () => {
      (conversationRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendMessage('Hi', 'missing', undefined, mockJwtPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteConversation', () => {
    it('should remove conversation and return true', async () => {
      const conv = createMockConversation();
      (conversationRepo.findOne as jest.Mock).mockResolvedValue(conv);
      (conversationRepo.remove as jest.Mock).mockResolvedValue(conv);

      const result = await service.deleteConversation('conv-1', mockJwtPayload);

      expect(conversationRepo.remove).toHaveBeenCalledWith(conv);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      (conversationRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteConversation('missing', mockJwtPayload)).rejects.toThrow(NotFoundException);
    });
  });
});
