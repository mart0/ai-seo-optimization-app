import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepo: jest.Mocked<Repository<User>>;
  let module: TestingModule;

  const mockUser: User = {
    id: 'user-1',
    auth0Id: 'auth0|abc',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    conversations: [],
  };

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
  });

  afterAll(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreate', () => {
    it('should return existing user when found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOrCreate('auth0|abc');

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|abc' } });
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should create and save new user when not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (userRepo.create as jest.Mock).mockReturnValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOrCreate('auth0|new', 'new@example.com', 'New User');

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|new' } });
      expect(userRepo.create).toHaveBeenCalledWith({
        auth0Id: 'auth0|new',
        email: 'new@example.com',
        name: 'New User',
      });
      expect(userRepo.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
