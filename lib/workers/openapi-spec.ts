/**
 * OpenAPI 3.0 specification for REST API endpoints
 * Documents all available REST endpoints with request/response schemas
 */

/**
 * Generate OpenAPI 3.0 specification
 */
export function generateOpenAPISpec(baseUrl: string): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Câmara dos Deputados MCP Server API',
      version: '1.0.0',
      description: 'REST API for accessing Brazilian Chamber of Deputies legislative data. Provides endpoints for querying deputies, propositions, votes, and events.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/aredes/mcp-camara',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Production server',
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check server health and status',
          operationId: 'getHealth',
          security: [],
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'healthy',
                      },
                      version: {
                        type: 'string',
                        example: '1.0.0',
                      },
                      toolCount: {
                        type: 'number',
                        example: 62,
                      },
                      initialized: {
                        type: 'boolean',
                        example: true,
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/deputados/{id}': {
        get: {
          summary: 'Get deputy details',
          description: 'Retrieve detailed information about a specific deputy by ID',
          operationId: 'getDeputyById',
          tags: ['Deputies'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Deputy ID',
              schema: {
                type: 'integer',
                minimum: 1,
              },
            },
          ],
          responses: {
            '200': {
              description: 'Deputy details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/DeputyDetails',
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/proposicoes/{id}': {
        get: {
          summary: 'Get proposition details',
          description: 'Retrieve detailed information about a specific proposition by ID',
          operationId: 'getPropositionById',
          tags: ['Propositions'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Proposition ID',
              schema: {
                type: 'integer',
                minimum: 1,
              },
            },
          ],
          responses: {
            '200': {
              description: 'Proposition details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PropositionDetails',
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/votacoes/{id}': {
        get: {
          summary: 'Get voting details',
          description: 'Retrieve detailed information about a specific voting by ID',
          operationId: 'getVotingById',
          tags: ['Votings'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Voting ID',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Voting details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/VotingDetails',
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/eventos/{id}': {
        get: {
          summary: 'Get event details',
          description: 'Retrieve detailed information about a specific event by ID',
          operationId: 'getEventById',
          tags: ['Events'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Event ID',
              schema: {
                type: 'integer',
                minimum: 1,
              },
            },
          ],
          responses: {
            '200': {
              description: 'Event details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Event',
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/mcp': {
        post: {
          summary: 'MCP protocol endpoint',
          description: 'JSON-RPC 2.0 endpoint for Model Context Protocol requests',
          operationId: 'mcpRequest',
          tags: ['MCP'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method'],
                  properties: {
                    jsonrpc: {
                      type: 'string',
                      enum: ['2.0'],
                    },
                    id: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'null' },
                      ],
                    },
                    method: {
                      type: 'string',
                      enum: ['tools/list', 'tools/call'],
                    },
                    params: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'JSON-RPC 2.0 response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonrpc: {
                        type: 'string',
                        enum: ['2.0'],
                      },
                      id: {
                        oneOf: [
                          { type: 'string' },
                          { type: 'number' },
                          { type: 'null' },
                        ],
                      },
                      result: {
                        type: 'object',
                      },
                      error: {
                        type: 'object',
                        properties: {
                          code: {
                            type: 'number',
                          },
                          message: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication. Required for REST endpoints when MCP_API_KEY is configured.',
        },
      },
      schemas: {
        DeputyDetails: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Deputy unique identifier',
            },
            uri: {
              type: 'string',
              description: 'API URI for this deputy',
            },
            nome: {
              type: 'string',
              description: 'Deputy name',
            },
            nomeCivil: {
              type: 'string',
              description: 'Civil name',
            },
            siglaPartido: {
              type: 'string',
              description: 'Party abbreviation',
            },
            siglaUf: {
              type: 'string',
              description: 'State abbreviation',
            },
            email: {
              type: 'string',
              description: 'Email address',
            },
            urlFoto: {
              type: 'string',
              description: 'Photo URL',
            },
            dataNascimento: {
              type: 'string',
              format: 'date',
              description: 'Birth date',
            },
            escolaridade: {
              type: 'string',
              description: 'Education level',
            },
          },
        },
        PropositionDetails: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Proposition unique identifier',
            },
            uri: {
              type: 'string',
              description: 'API URI for this proposition',
            },
            siglaTipo: {
              type: 'string',
              description: 'Proposition type abbreviation',
            },
            numero: {
              type: 'integer',
              description: 'Proposition number',
            },
            ano: {
              type: 'integer',
              description: 'Year',
            },
            ementa: {
              type: 'string',
              description: 'Summary',
            },
            dataApresentacao: {
              type: 'string',
              format: 'date',
              description: 'Presentation date',
            },
            keywords: {
              type: 'string',
              description: 'Keywords',
            },
          },
        },
        VotingDetails: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Voting unique identifier',
            },
            uri: {
              type: 'string',
              description: 'API URI for this voting',
            },
            data: {
              type: 'string',
              format: 'date',
              description: 'Voting date',
            },
            descricao: {
              type: 'string',
              description: 'Description',
            },
            aprovacao: {
              type: 'integer',
              description: 'Approval status',
            },
            votosSim: {
              type: 'integer',
              description: 'Yes votes',
            },
            votosNao: {
              type: 'integer',
              description: 'No votes',
            },
            votosOutros: {
              type: 'integer',
              description: 'Other votes',
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Event unique identifier',
            },
            uri: {
              type: 'string',
              description: 'API URI for this event',
            },
            dataHoraInicio: {
              type: 'string',
              format: 'date-time',
              description: 'Start date and time',
            },
            dataHoraFim: {
              type: 'string',
              format: 'date-time',
              description: 'End date and time',
            },
            situacao: {
              type: 'string',
              description: 'Event status',
            },
            descricaoTipo: {
              type: 'string',
              description: 'Event type description',
            },
            descricao: {
              type: 'string',
              description: 'Event description',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request - invalid parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - invalid or missing API key',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Too many requests - rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    $ref: '#/components/schemas/Error',
                  },
                  {
                    type: 'object',
                    properties: {
                      retryAfter: {
                        type: 'number',
                        description: 'Seconds to wait before retrying',
                      },
                    },
                  },
                ],
              },
            },
          },
          headers: {
            'Retry-After': {
              description: 'Seconds to wait before retrying',
              schema: {
                type: 'integer',
              },
            },
            'X-RateLimit-Limit': {
              description: 'Request limit per minute',
              schema: {
                type: 'integer',
              },
            },
            'X-RateLimit-Remaining': {
              description: 'Remaining requests in current window',
              schema: {
                type: 'integer',
              },
            },
            'X-RateLimit-Reset': {
              description: 'Time when rate limit resets',
              schema: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Deputies',
        description: 'Operations related to deputies (members of parliament)',
      },
      {
        name: 'Propositions',
        description: 'Operations related to legislative propositions',
      },
      {
        name: 'Votings',
        description: 'Operations related to voting records',
      },
      {
        name: 'Events',
        description: 'Operations related to legislative events',
      },
      {
        name: 'MCP',
        description: 'Model Context Protocol operations',
      },
    ],
  };
}
