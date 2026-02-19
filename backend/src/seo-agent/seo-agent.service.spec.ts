import { Test, TestingModule } from '@nestjs/testing';
import { SeoAgentService } from './seo-agent.service';
import { generateText } from 'ai';

jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: jest.fn((opts: { description: string; parameters: unknown; execute: () => Promise<string> }) => opts),
}));

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('SeoAgentService', () => {
  let service: SeoAgentService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      providers: [SeoAgentService],
    }).compile();

    service = module.get<SeoAgentService>(SeoAgentService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyze', () => {
    it('should return generated text when generateText succeeds', async () => {
      const expectedText = 'Here is your SEO analysis.';
      mockGenerateText.mockResolvedValue({ text: expectedText } as Awaited<ReturnType<typeof generateText>>);

      const result = await service.analyze('Analyze https://example.com', [], undefined);

      expect(mockGenerateText).toHaveBeenCalled();
      expect(result).toBe(expectedText);
    });

    it('should pass modelId to generateText when provided', async () => {
      mockGenerateText.mockResolvedValue({ text: 'OK' } as Awaited<ReturnType<typeof generateText>>);

      await service.analyze('Hi', [], 'llama-3-70b');

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.any(Array),
          system: expect.any(String),
          tools: expect.any(Object),
          maxSteps: 3,
        }),
      );
      const call = mockGenerateText.mock.calls[0][0];
      expect(call.model).toBeDefined();
    });

    it('should return fallback message when generateText throws', async () => {
      mockGenerateText.mockRejectedValue(new Error('API error'));

      const result = await service.analyze('Hi', []);

      expect(result).toBe(
        'I encountered an error while analyzing. Please make sure the URL is valid and try again.',
      );
    });
  });
});
