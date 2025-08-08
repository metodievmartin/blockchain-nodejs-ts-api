import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Blockchain API',
    version: '1.0.0',
    description:
      'A scalable backend service with blockchain integration, user authentication, and transaction management',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Common response schemas
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            description: 'Error type/name',
            example: 'Internal Server Error',
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Something went wrong. Please try again later.',
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      // Validation Error - 400 Bad Request with validation details
      ValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Validation errors organized by field name',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              field: ['Field validation error message'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      // Specific validation errors for different endpoints
      RegisterValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Registration validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              email: ['Email must be a valid email address'],
              username: ['Username must be between 3 and 30 characters'],
              password: [
                'Password is required',
                'Password must be at least 8 characters',
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
              ],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      LoginValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Login validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              email: ['Email must be a valid email address'],
              password: ['Password is required'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      RefreshTokenValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Refresh token validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              refreshToken: ['Refresh token is required'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      LogoutValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Logout validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              refreshToken: ['Refresh token is required'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      UpdateUserProfileValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Update user profile validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              email: ['Email must be a valid email address'],
              username: ['Username must be between 3 and 30 characters'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      ChangePasswordValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request body — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Change password validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              currentPassword: ['Current password is required'],
              newPassword: [
                'New password is required',
                'New password must be at least 8 characters',
                'New password must be different from current password',
              ],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      TransactionsQueryValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request query — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Transactions query validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              fromBlock: ['From block must be a valid block number'],
              toBlock: ['To block must be a valid block number'],
              page: ['Page must be a positive integer'],
              limit: ['Limit must be a positive integer'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      AddressParamValidationError: {
        type: 'object',
        required: ['error', 'message', 'details'],
        properties: {
          error: {
            type: 'string',
            enum: ['Bad Request'],
            description: 'Error type for validation errors',
          },
          message: {
            type: 'string',
            example: 'Invalid request parameter — please check your input',
            description: 'Validation error message',
          },
          details: {
            type: 'object',
            description: 'Address parameter validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              address: ['Address must be a valid Ethereum address'],
            },
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      // Unauthorized Error - 401
      UnauthorizedError: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            enum: ['Unauthorized'],
            description: 'Error type for unauthorized access',
          },
          message: {
            type: 'string',
            description: 'Unauthorized error message',
            enum: [
              'Incorrect email or password',
              'Invalid access token',
              'Invalid refresh token',
              'Refresh token expired',
              'Current password is incorrect',
              'Authentication required',
            ],
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      // Conflict Error - 409
      ConflictError: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            enum: ['Conflict'],
            description: 'Error type for resource conflicts',
          },
          message: {
            type: 'string',
            description: 'Conflict error message',
            enum: [
              'User with this email already exists',
              'User with this username already exists',
              'Email is already taken',
              'Username is already taken',
            ],
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (only in development)',
          },
        },
      },
      // Auth schemas
      RegisterRequest: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 30,
            description: 'Username',
            example: 'johndoe',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Password',
            example: 'mySecurePassword123!',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          password: {
            type: 'string',
            description: 'Password',
            example: 'mySecurePassword123!',
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token',
          },
        },
      },
      LogoutRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token to invalidate',
          },
        },
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User ID',
            example: '8de89caa-2765-43ce-a200-12bff99b9ae4',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          username: {
            type: 'string',
            description: 'Username',
            example: 'johndoe',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
            example: '2025-08-08T07:36:08.285Z',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'Refresh token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          expiresIn: {
            type: 'integer',
            description: 'Access token expiration time in seconds',
            example: 900,
          },
        },
      },
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
            example: '8de89caa-2765-43ce-a200-12bff99b9ae4',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          username: {
            type: 'string',
            description: 'Username',
            example: 'johndoe',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
            example: '2025-08-08T07:36:08.285Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp',
            example: '2025-08-08T07:36:08.285Z',
          },
        },
      },
      UpdateUserProfileRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'New email address',
            example: 'john.doe@example.com',
          },
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 30,
            description: 'New username',
            example: 'johndoe',
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            description: 'Current password',
            example: 'myCurrentPassword123',
          },
          newPassword: {
            type: 'string',
            minLength: 8,
            description: 'New password',
            example: 'myNewSecurePassword456',
          },
        },
      },
      // Blockchain schemas
      Transaction: {
        type: 'object',
        properties: {
          hash: {
            type: 'string',
            description: 'Transaction hash',
            example:
              '0x90f844fb4509e12f9be3d75e489167436e0ef3be73c328b6f0a9021b9416742c',
          },
          blockNumber: {
            type: 'string',
            description: 'Block number',
            example: '3236805',
          },
          from: {
            type: 'string',
            description: 'Sender address',
            example: '0x5dad5eb7a3e557642625399d51577838d26deae0',
          },
          to: {
            type: 'string',
            nullable: true,
            description: 'Recipient address (null for contract creation)',
            example: null,
          },
          value: {
            type: 'string',
            description: 'Transaction value in wei',
            example: '0',
          },
          gasPrice: {
            type: 'string',
            description: 'Gas price in wei',
            example: '100000000000',
          },
          gasUsed: {
            type: 'string',
            description: 'Gas used by the transaction',
            example: '510131',
          },
          gas: {
            type: 'string',
            description: 'Gas limit',
            example: '612157',
          },
          functionName: {
            type: 'string',
            nullable: true,
            description: 'Function signature or input data',
            example: '0x60c06040',
          },
          txReceiptStatus: {
            type: 'string',
            description: 'Transaction receipt status (1 = success, 0 = failed)',
            example: '1',
          },
          contractAddress: {
            type: 'string',
            nullable: true,
            description:
              'Contract address (for contract creation transactions)',
            example: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction timestamp',
            example: '2023-04-06T08:41:24.000Z',
          },
        },
      },
      TransactionsResponse: {
        type: 'object',
        properties: {
          fromCache: {
            type: 'boolean',
            description: 'Whether the response was served from cache',
            example: false,
          },
          transactions: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Transaction',
            },
            description: 'Array of transactions',
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                description: 'Current page number',
                example: 1,
              },
              limit: {
                type: 'integer',
                description: 'Number of items per page',
                example: 1000,
              },
              hasMore: {
                type: 'boolean',
                description: 'Whether there are more pages available',
                example: true,
              },
            },
            required: ['page', 'limit'],
          },
          metadata: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'The queried address',
                example: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
              },
              fromBlock: {
                type: 'integer',
                description: 'Starting block number for the query',
                example: 3236805,
              },
              toBlock: {
                type: 'integer',
                description: 'Ending block number for the query',
                example: 4000000,
              },
              source: {
                type: 'string',
                enum: ['database', 'etherscan', 'cache'],
                description: 'Data source for the transactions',
                example: 'database',
              },
            },
            required: ['address', 'source'],
          },
        },
        required: ['fromCache', 'transactions', 'pagination', 'metadata'],
      },
      BalanceResponse: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address',
            example: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
          },
          balance: {
            type: 'string',
            description: 'Balance in ETH',
            example: '543970.785193375297974609',
          },
          balanceWei: {
            type: 'string',
            description: 'Balance in wei',
            example: '543970785193375297974609',
          },
          blockNumber: {
            type: 'integer',
            description: 'Block number when balance was retrieved',
            example: 8938344,
          },
          lastUpdated: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when balance was last updated',
            example: '2025-08-08T08:18:14.662Z',
          },
          fromCache: {
            type: 'boolean',
            description: 'Whether the response was served from cache',
            example: false,
          },
          source: {
            type: 'string',
            enum: ['cache', 'provider', 'database'],
            description: 'Data source for the balance',
            example: 'provider',
          },
        },
        required: [
          'address',
          'balance',
          'balanceWei',
          'blockNumber',
          'lastUpdated',
          'fromCache',
          'source',
        ],
      },
      CountResponse: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address',
            example: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
          },
          count: {
            type: 'integer',
            description: 'Number of stored transactions',
            example: 623159,
          },
          fromCache: {
            type: 'boolean',
            description: 'Whether the response was served from cache',
            example: false,
          },
          source: {
            type: 'string',
            enum: ['cache', 'database'],
            description: 'Data source for the count',
            example: 'database',
          },
        },
        required: ['address', 'count', 'fromCache', 'source'],
      },
      QueueInfoResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              waiting: {
                type: 'integer',
                description: 'Number of jobs waiting in the queue',
                example: 0,
              },
              active: {
                type: 'integer',
                description: 'Number of jobs currently being processed',
                example: 0,
              },
              completed: {
                type: 'integer',
                description: 'Number of completed jobs',
                example: 100,
              },
              failed: {
                type: 'integer',
                description: 'Number of failed jobs',
                example: 0,
              },
              delayed: {
                type: 'integer',
                description: 'Number of delayed jobs',
                example: 3,
              },
            },
            required: ['waiting', 'active', 'completed', 'failed', 'delayed'],
          },
        },
        required: ['data'],
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/modules/**/*.docs.ts', // Path to the documentation files
    './src/config/swagger.ts', // Keep this file for schemas
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions: SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
  },
};
