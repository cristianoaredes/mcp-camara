/**
 * Tests for tool registry infrastructure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ToolRegistry,
  type ToolDefinition,
  type ToolContext,
  type ToolResult,
  DEPUTY_TOOLS,
  PROPOSITION_TOOLS,
  VOTING_TOOLS,
  COMMITTEE_TOOLS,
  PARTY_TOOLS,
  EVENT_TOOLS,
  REFERENCE_TOOLS,
  ALL_TOOLS,
} from '../lib/core/tools.js';
import { z } from 'zod';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('Tool Registration', () => {
    it('should register a tool successfully', () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: z.object({}),
        handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
        category: 'deputies',
      };

      registry.register(tool);

      expect(registry.has('test_tool')).toBe(true);
      expect(registry.count()).toBe(1);
    });

    it('should throw error when registering duplicate tool', () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: z.object({}),
        handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
        category: 'deputies',
      };

      registry.register(tool);

      expect(() => registry.register(tool)).toThrow('Tool "test_tool" is already registered');
    });

    it('should register multiple tools at once', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'test1' }] }),
          category: 'deputies',
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'test2' }] }),
          category: 'propositions',
        },
      ];

      registry.registerMany(tools);

      expect(registry.count()).toBe(2);
      expect(registry.has('tool1')).toBe(true);
      expect(registry.has('tool2')).toBe(true);
    });
  });

  describe('Tool Retrieval', () => {
    beforeEach(() => {
      const tools: ToolDefinition[] = [
        {
          name: 'deputy_tool',
          description: 'Deputy tool',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'deputy' }] }),
          category: 'deputies',
        },
        {
          name: 'proposition_tool',
          description: 'Proposition tool',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'proposition' }] }),
          category: 'propositions',
        },
        {
          name: 'voting_tool',
          description: 'Voting tool',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'voting' }] }),
          category: 'votings',
        },
      ];

      registry.registerMany(tools);
    });

    it('should get a tool by name', () => {
      const tool = registry.get('deputy_tool');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('deputy_tool');
      expect(tool?.category).toBe('deputies');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.get('non_existent');

      expect(tool).toBeUndefined();
    });

    it('should get all registered tools', () => {
      const tools = registry.getAll();

      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('deputy_tool');
      expect(tools.map(t => t.name)).toContain('proposition_tool');
      expect(tools.map(t => t.name)).toContain('voting_tool');
    });

    it('should get tools by category', () => {
      const deputyTools = registry.getByCategory('deputies');
      const propositionTools = registry.getByCategory('propositions');

      expect(deputyTools).toHaveLength(1);
      expect(deputyTools[0]?.name).toBe('deputy_tool');

      expect(propositionTools).toHaveLength(1);
      expect(propositionTools[0]?.name).toBe('proposition_tool');
    });

    it('should get all tool names', () => {
      const names = registry.getNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('deputy_tool');
      expect(names).toContain('proposition_tool');
      expect(names).toContain('voting_tool');
    });
  });

  describe('Tool Management', () => {
    it('should check if tool exists', () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: z.object({}),
        handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
        category: 'deputies',
      };

      expect(registry.has('test_tool')).toBe(false);

      registry.register(tool);

      expect(registry.has('test_tool')).toBe(true);
    });

    it('should get correct count of registered tools', () => {
      expect(registry.count()).toBe(0);

      registry.register({
        name: 'tool1',
        description: 'Tool 1',
        inputSchema: z.object({}),
        handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
        category: 'deputies',
      });

      expect(registry.count()).toBe(1);

      registry.register({
        name: 'tool2',
        description: 'Tool 2',
        inputSchema: z.object({}),
        handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
        category: 'propositions',
      });

      expect(registry.count()).toBe(2);
    });

    it('should clear all registered tools', () => {
      registry.registerMany([
        {
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
          category: 'deputies',
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          inputSchema: z.object({}),
          handler: async () => ({ content: [{ type: 'text', text: 'test' }] }),
          category: 'propositions',
        },
      ]);

      expect(registry.count()).toBe(2);

      registry.clear();

      expect(registry.count()).toBe(0);
      expect(registry.has('tool1')).toBe(false);
      expect(registry.has('tool2')).toBe(false);
    });
  });
});

describe('Tool Constants', () => {
  it('should have correct number of deputy tools', () => {
    expect(DEPUTY_TOOLS).toHaveLength(15);
  });

  it('should have correct number of proposition tools', () => {
    expect(PROPOSITION_TOOLS).toHaveLength(10);
  });

  it('should have correct number of voting tools', () => {
    expect(VOTING_TOOLS).toHaveLength(4);
  });

  it('should have correct number of committee tools', () => {
    expect(COMMITTEE_TOOLS).toHaveLength(5);
  });

  it('should have correct number of party tools', () => {
    expect(PARTY_TOOLS).toHaveLength(6);
  });

  it('should have correct number of event tools', () => {
    expect(EVENT_TOOLS).toHaveLength(7);
  });

  it('should have correct number of reference tools', () => {
    expect(REFERENCE_TOOLS).toHaveLength(15);
  });

  it('should have exactly 62 tools in total', () => {
    expect(ALL_TOOLS).toHaveLength(62);
  });

  it('should have unique tool names', () => {
    const uniqueNames = new Set(ALL_TOOLS);
    expect(uniqueNames.size).toBe(ALL_TOOLS.length);
  });
});

describe('Tool Handler Interface', () => {
  it('should accept valid tool context', async () => {
    const mockContext: ToolContext = {
      httpClient: {} as any,
      cache: {} as any,
      config: {} as any,
      logger: {} as any,
    };

    const handler = async (args: unknown, context: ToolContext): Promise<ToolResult> => {
      expect(context).toBeDefined();
      expect(context.httpClient).toBeDefined();
      expect(context.cache).toBeDefined();
      expect(context.config).toBeDefined();
      expect(context.logger).toBeDefined();

      return {
        content: [{ type: 'text', text: 'success' }],
      };
    };

    const result = await handler({}, mockContext);

    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.text).toBe('success');
  });

  it('should return error result when isError is true', async () => {
    const handler = async (): Promise<ToolResult> => {
      return {
        content: [{ type: 'text', text: 'Error occurred' }],
        isError: true,
      };
    };

    const result = await handler({}, {} as any);

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toBe('Error occurred');
  });
});
