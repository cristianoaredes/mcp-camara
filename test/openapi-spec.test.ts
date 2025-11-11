/**
 * OpenAPI specification tests
 * Tests the OpenAPI 3.0 spec generation and endpoint
 */

import { describe, it, expect } from 'vitest';
import { generateOpenAPISpec } from '../lib/workers/openapi-spec.js';

describe('OpenAPI Specification', () => {
  it('should generate valid OpenAPI 3.0 spec', () => {
    const baseUrl = 'https://api.example.com';
    const spec = generateOpenAPISpec(baseUrl);

    // Validate OpenAPI version
    expect(spec).toHaveProperty('openapi', '3.0.3');

    // Validate info section
    expect(spec).toHaveProperty('info');
    expect((spec as any).info).toHaveProperty('title');
    expect((spec as any).info).toHaveProperty('version');
    expect((spec as any).info).toHaveProperty('description');
    expect((spec as any).info.title).toBe('Câmara dos Deputados MCP Server API');
  });

  it('should include server configuration with provided base URL', () => {
    const baseUrl = 'https://api.example.com';
    const spec = generateOpenAPISpec(baseUrl);

    expect(spec).toHaveProperty('servers');
    expect((spec as any).servers).toBeInstanceOf(Array);
    expect((spec as any).servers[0]).toHaveProperty('url', baseUrl);
  });

  it('should define all REST endpoints', () => {
    const spec = generateOpenAPISpec('https://api.example.com');

    expect(spec).toHaveProperty('paths');
    const paths = (spec as any).paths;

    // Check all required endpoints exist
    expect(paths).toHaveProperty('/health');
    expect(paths).toHaveProperty('/deputados/{id}');
    expect(paths).toHaveProperty('/proposicoes/{id}');
    expect(paths).toHaveProperty('/votacoes/{id}');
    expect(paths).toHaveProperty('/eventos/{id}');
    expect(paths).toHaveProperty('/mcp');
  });

  it('should define GET method for REST resource endpoints', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const paths = (spec as any).paths;

    // Check GET methods exist for resource endpoints
    expect(paths['/deputados/{id}']).toHaveProperty('get');
    expect(paths['/proposicoes/{id}']).toHaveProperty('get');
    expect(paths['/votacoes/{id}']).toHaveProperty('get');
    expect(paths['/eventos/{id}']).toHaveProperty('get');
    expect(paths['/health']).toHaveProperty('get');
  });

  it('should define POST method for MCP endpoint', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const paths = (spec as any).paths;

    expect(paths['/mcp']).toHaveProperty('post');
    expect(paths['/mcp'].post).toHaveProperty('requestBody');
    expect(paths['/mcp'].post).toHaveProperty('responses');
  });

  it('should include API key authentication scheme', () => {
    const spec = generateOpenAPISpec('https://api.example.com');

    expect(spec).toHaveProperty('components');
    expect((spec as any).components).toHaveProperty('securitySchemes');
    expect((spec as any).components.securitySchemes).toHaveProperty('ApiKeyAuth');
    
    const apiKeyAuth = (spec as any).components.securitySchemes.ApiKeyAuth;
    expect(apiKeyAuth).toHaveProperty('type', 'apiKey');
    expect(apiKeyAuth).toHaveProperty('in', 'header');
    expect(apiKeyAuth).toHaveProperty('name', 'X-API-Key');
  });

  it('should define request/response schemas for all resources', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const schemas = (spec as any).components.schemas;

    // Check all resource schemas exist
    expect(schemas).toHaveProperty('DeputyDetails');
    expect(schemas).toHaveProperty('PropositionDetails');
    expect(schemas).toHaveProperty('VotingDetails');
    expect(schemas).toHaveProperty('Event');
    expect(schemas).toHaveProperty('Error');
  });

  it('should define standard error responses', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const responses = (spec as any).components.responses;

    // Check all standard error responses exist
    expect(responses).toHaveProperty('BadRequest');
    expect(responses).toHaveProperty('Unauthorized');
    expect(responses).toHaveProperty('TooManyRequests');
    expect(responses).toHaveProperty('InternalServerError');
  });

  it('should include rate limit headers in TooManyRequests response', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const tooManyRequests = (spec as any).components.responses.TooManyRequests;

    expect(tooManyRequests).toHaveProperty('headers');
    expect(tooManyRequests.headers).toHaveProperty('Retry-After');
    expect(tooManyRequests.headers).toHaveProperty('X-RateLimit-Limit');
    expect(tooManyRequests.headers).toHaveProperty('X-RateLimit-Remaining');
    expect(tooManyRequests.headers).toHaveProperty('X-RateLimit-Reset');
  });

  it('should include path parameters for resource endpoints', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const paths = (spec as any).paths;

    // Check deputados endpoint has id parameter
    const deputadosGet = paths['/deputados/{id}'].get;
    expect(deputadosGet).toHaveProperty('parameters');
    expect(deputadosGet.parameters).toBeInstanceOf(Array);
    expect(deputadosGet.parameters[0]).toHaveProperty('name', 'id');
    expect(deputadosGet.parameters[0]).toHaveProperty('in', 'path');
    expect(deputadosGet.parameters[0]).toHaveProperty('required', true);
  });

  it('should include tags for organizing endpoints', () => {
    const spec = generateOpenAPISpec('https://api.example.com');

    expect(spec).toHaveProperty('tags');
    expect((spec as any).tags).toBeInstanceOf(Array);
    
    const tagNames = (spec as any).tags.map((tag: any) => tag.name);
    expect(tagNames).toContain('Deputies');
    expect(tagNames).toContain('Propositions');
    expect(tagNames).toContain('Votings');
    expect(tagNames).toContain('Events');
    expect(tagNames).toContain('MCP');
  });

  it('should document authentication requirements', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const paths = (spec as any).paths;

    // REST endpoints should require authentication
    expect(paths['/deputados/{id}'].get.responses).toHaveProperty('401');
    expect(paths['/proposicoes/{id}'].get.responses).toHaveProperty('401');
    expect(paths['/votacoes/{id}'].get.responses).toHaveProperty('401');
    expect(paths['/eventos/{id}'].get.responses).toHaveProperty('401');

    // Health and MCP endpoints should not require authentication
    expect(paths['/health'].get).toHaveProperty('security', []);
    expect(paths['/mcp'].post).toHaveProperty('security', []);
  });

  it('should include operation IDs for all endpoints', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const paths = (spec as any).paths;

    expect(paths['/health'].get).toHaveProperty('operationId', 'getHealth');
    expect(paths['/deputados/{id}'].get).toHaveProperty('operationId', 'getDeputyById');
    expect(paths['/proposicoes/{id}'].get).toHaveProperty('operationId', 'getPropositionById');
    expect(paths['/votacoes/{id}'].get).toHaveProperty('operationId', 'getVotingById');
    expect(paths['/eventos/{id}'].get).toHaveProperty('operationId', 'getEventById');
    expect(paths['/mcp'].post).toHaveProperty('operationId', 'mcpRequest');
  });

  it('should define schema properties for DeputyDetails', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const deputySchema = (spec as any).components.schemas.DeputyDetails;

    expect(deputySchema).toHaveProperty('type', 'object');
    expect(deputySchema).toHaveProperty('properties');
    
    const props = deputySchema.properties;
    expect(props).toHaveProperty('id');
    expect(props).toHaveProperty('nome');
    expect(props).toHaveProperty('siglaPartido');
    expect(props).toHaveProperty('siglaUf');
    expect(props).toHaveProperty('email');
  });

  it('should define schema properties for PropositionDetails', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    const propositionSchema = (spec as any).components.schemas.PropositionDetails;

    expect(propositionSchema).toHaveProperty('type', 'object');
    expect(propositionSchema).toHaveProperty('properties');
    
    const props = propositionSchema.properties;
    expect(props).toHaveProperty('id');
    expect(props).toHaveProperty('siglaTipo');
    expect(props).toHaveProperty('numero');
    expect(props).toHaveProperty('ano');
    expect(props).toHaveProperty('ementa');
  });

  it('should be valid JSON serializable', () => {
    const spec = generateOpenAPISpec('https://api.example.com');
    
    // Should not throw when serializing
    expect(() => JSON.stringify(spec)).not.toThrow();
    
    // Should be able to parse back
    const serialized = JSON.stringify(spec);
    const parsed = JSON.parse(serialized);
    expect(parsed).toEqual(spec);
  });
});
