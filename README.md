# Blockchain API

## Project Overview

A blockchain API service built with Node.js, TypeScript, and Express.js that provides Ethereum blockchain
integration alongside user authentication and management capabilities. This project demonstrates
architecture patterns, security best practices, and scalable design principles.

### Key Features

- **Authentication & Authorization**: JWT-based authentication with secure password hashing
- **User Management**: Complete user profile management with authentication
- **Blockchain Integration**: Ethereum transaction querying, balance checking, and address validation
- **Smart Caching**: Multi-tier caching system (Redis + Database + Provider) for optimal performance
- **Docker Support**: Complete containerisation with multi-service orchestration
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Testing Suite**: Unit and integration tests (still in progress)
- **Security**: Production-ready security middlewares and best practices
- **Scalability**: Queue-based background processing for heavy operations

### Architecture Highlights

- **Modular Design**: Feature-based folder structure with versioned APIs
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Caching**: Redis for high-performance caching and session management
- **Background Jobs**: Queue system with BullMQ for processing blockchain data asynchronously
- **Monitoring**: Comprehensive logging with Winston and health check endpoints
- **Security**: Helmet, CORS, rate limiting, and input validation

### Tech Stack

**Core Technologies:**

- Node.js 22+ with TypeScript
- Express.js for REST API framework
- PostgreSQL for primary database
- Redis for caching and sessions
- Prisma ORM for database operations
- BullMQ for background processing
- JWT for authentication

**Blockchain Integration:**

- Ethers.js for Ethereum interaction
- Etherscan API for transaction data
- Smart contract detection and validation

**Development & Operations:**

- Docker & Docker Compose for containerisation
- Jest and Supertest for testing
- ESLint & Prettier for code quality
- Winston for structured logging
- Swagger/OpenAPI for documentation

## Installation & Setup

### Prerequisites

- **Node.js** 22+ and npm
- **Docker** and Docker Compose (for containerised setup)
- **Git** for version control

### 🚀 Quick Start with Docker (Recommended)

The fastest way to get the application running is using Docker Compose:

```bash
# 1. Clone the repository
git clone <repository-url>
cd ai-be-task-lqmwgk

# 2. Configure environment variables
cp .env.docker .env
# Edit .env and add your API keys:
# - SEPOLIA_RPC_URL (Alchemy, Infura, or other Ethereum provider)
# - ETHERSCAN_API_KEY (from etherscan.io)

# 3. Start all services
docker-compose up --build
```

The application will be available at:

- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api-docs
- **Health Check**: http://localhost:8000/health

### Local Development Setup

For development with hot reloading and debugging:

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd ai-be-task-lqmwgk
npm install

# 2. Start only the databases with Docker
npm run dev:db:up

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys and configuration

# 4. Set up the database
npm run prisma:push
npm run prisma:generate

# 5. Start the development server
npm run dev:server

# 6. Start the background worker
npm run dev:worker

# Alternatively, you can run both in development mode:
# I recommend starting them in two separate terminals otherwise there's too much clutter
npm run dev:all  
```

### Environment Configuration

#### Required Environment Variables

```bash
# Blockchain API Keys (Required)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Security (Required)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Database & Redis (Auto-configured for Docker) - use this for local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
REDIS_URL=redis://devuser:devpassword@localhost:6379
```

#### Optional Configuration

```bash
# Performance Tuning
BLOCKCHAIN_BATCH_SIZE=1000          # Transactions per batch
BLOCKCHAIN_SYNC_THRESHOLD=2000      # Background processing threshold
BALANCE_CACHE_TTL=30               # Balance cache duration (seconds)

# Security
SALT_ROUNDS=12                     # Password hashing rounds
CORS_ORIGIN=*                      # CORS allowed origins

# Logging
LOG_LEVEL=info                     # debug, info, warn, error
```

### Database Setup

The application uses PostgreSQL with Prisma ORM:

```bash
# Push schema to database
npm run prisma:push

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (development only)
npx prisma db push --force-reset
```

## Available Scripts

### Build & Production

| Script                 | Description                                             |
|------------------------|---------------------------------------------------------|
| `npm run build`        | Compile TypeScript to JavaScript in `dist/` folder      |
| `npm run start:server` | Start the production API server (requires build)        |
| `npm run start:worker` | Start the production background worker (requires build) |
| `npm run start:all`    | Start both API server and worker in production mode     |

### Development

| Script               | Description                                           |
|----------------------|-------------------------------------------------------|
| `npm run dev:server` | Start API server with hot reload using nodemon        |
| `npm run dev:worker` | Start background worker with hot reload using nodemon |
| `npm run dev:all`    | Start both API server and worker in development mode  |
| `npm run worker`     | Run worker directly with ts-node (for debugging)      |

### Testing

| Script                           | Description                               |
|----------------------------------|-------------------------------------------|
| `npm test`                       | Run all tests with open handles detection |
| `npm run test:unit`              | Run only unit tests                       |
| `npm run test:integration`       | Run only integration tests                |
| `npm run test:unit:watch`        | Run unit tests in watch mode              |
| `npm run test:integration:watch` | Run integration tests in watch mode       |
| `npm run test:watch`             | Run all tests in watch mode               |
| `npm run test:coverage`          | Generate test coverage report             |

### Code Quality

| Script             | Description                                     |
|--------------------|-------------------------------------------------|
| `npm run lint`     | Check code for linting errors                   |
| `npm run lint:fix` | Automatically fix linting errors where possible |

### Database Management

| Script                    | Description                        |
|---------------------------|------------------------------------|
| `npm run prisma:push`     | Push schema changes to database    |
| `npm run prisma:generate` | Generate Prisma client from schema |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI)  |
| `npm run prisma:seed`     | Seed database with initial data    |

### Docker Development

| Script                | Description                                                      |
|-----------------------|------------------------------------------------------------------|
| `npm run dev:db:up`   | Start only PostgreSQL and Redis containers for local development |
| `npm run dev:db:down` | Stop development database containers                             |
| `npm run dev:db:logs` | View logs from development database containers                   |
| `npm run redis:cli`   | Connect to Redis CLI in the container                            |

### Common Development Workflows

```bash
# Full development setup
npm run dev:db:up        # Start databases
npm run prisma:push      # Set up database schema
npm run dev:server       # Start API server
npm run dev:worker       # Start background worker

# Testing workflow
npm run test:unit:watch  # Run unit tests in watch mode
npm run test:coverage    # Check test coverage

# Production build
npm run build           # Compile TypeScript
npm run start:all       # Start production services
```

## API Endpoints

### Base URL

- **Development**: `http://localhost:8000`
- **API Version**: `v1`
- **Base Path**: `/api/v1`

### Documentation

- **Interactive Swagger UI**: `http://localhost:8000/api-docs`
- **OpenAPI JSON Spec**: `http://localhost:8000/api-docs.json`

### Authentication Endpoints

| Method | Endpoint                  | Description                              | Auth Required |
|--------|---------------------------|------------------------------------------|---------------|
| `POST` | `/api/v1/auth/register`   | Register a new user account              | ❌             |
| `POST` | `/api/v1/auth/login`      | Login with email/username and password   | ❌             |
| `POST` | `/api/v1/auth/refresh`    | Refresh access token using refresh token | ❌             |
| `POST` | `/api/v1/auth/logout`     | Logout from current session              | ✅             |
| `POST` | `/api/v1/auth/logout-all` | Logout from all devices/sessions         | ✅             |

#### Example: User Registration

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePassword123!"
  }'
```

### User Management Endpoints

| Method | Endpoint                    | Description              | Auth Required |
|--------|-----------------------------|--------------------------|---------------|
| `GET`  | `/api/v1/users/me`          | Get current user profile | ✅             |
| `PUT`  | `/api/v1/users/me`          | Update user profile      | ✅             |
| `PUT`  | `/api/v1/users/me/password` | Change user password     | ✅             |

#### Example: Get User Profile

```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Blockchain Endpoints

| Method | Endpoint                                    | Description                                 | Auth Required |
|--------|---------------------------------------------|---------------------------------------------|---------------|
| `GET`  | `/api/v1/eth/address/:address/transactions` | Get transactions for an Ethereum address    | ❌             |
| `GET`  | `/api/v1/eth/address/:address/balance`      | Get ETH balance for an address              | ❌             |
| `GET`  | `/api/v1/eth/address/:address/count`        | Get stored transaction count for an address | ❌             |
| `GET`  | `/api/v1/eth/address/queue-info`            | Get queue processing statistics (dev only)  | ❌             |

#### Query Parameters for Transactions

| Parameter   | Type   | Description                | Default                          |
|-------------|--------|----------------------------|----------------------------------|
| `fromBlock` | number | Starting block number      | `0` (or contract creation block) |
| `toBlock`   | number | Ending block number        | Latest block                     |
| `page`      | number | Page number for pagination | `1`                              |
| `limit`     | number | Items per page (max 1000)  | `1000`                           |

#### Example: Get Transactions

```bash
# Get all transactions for an address
curl "http://localhost:8000/api/v1/eth/address/0x742d35Cc6634C0532925a3b8D5c9C4B9e4C4c4c4/transactions"

# Get transactions with pagination and block range
curl "http://localhost:8000/api/v1/eth/address/0x742d35Cc6634C0532925a3b8D5c9C4B9e4C4c4c4/transactions?fromBlock=18000000&toBlock=18100000&page=1&limit=100"
```

#### Example: Get Balance

```bash
curl "http://localhost:8000/api/v1/eth/address/0x742d35Cc6634C0532925a3b8D5c9C4B9e4C4c4c4/balance"
```

### System Endpoints

| Method | Endpoint  | Description                    | Auth Required |
|--------|-----------|--------------------------------|---------------|
| `GET`  | `/health` | Health check and system status | ❌             |

### Response Formats

#### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "metadata": {
    "page": 1,
    "limit": 100,
    "total": 1500,
    "fromBlock": 18000000,
    "toBlock": 18100000
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to receive an access token and refresh token
2. **Include the access token** in the `Authorization` header: `Bearer YOUR_TOKEN`
3. **Refresh tokens** when they expire using the `/auth/refresh` endpoint

```bash
# Example authenticated request
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Project Architecture

### Directory Structure

```
src/
├── app.ts                    # Express app configuration
├── server.ts                 # Application entry point
├── routes.ts                 # API route mounting and documentation
├── config/                   # Configuration modules
│   ├── app.config.ts         # Centralized app configuration
│   ├── env.ts               # Environment variable validation
│   ├── db.ts                # Database connection setup
│   ├── redis.ts             # Redis connection setup
│   ├── logger.ts            # Winston logging configuration
│   ├── providers.ts         # Ethereum provider setup
│   └── swagger.ts           # OpenAPI/Swagger configuration
├── core/                    # Core business logic
│   ├── auth/                # Authentication utilities
│   └── cache/               # Caching abstractions
├── lib/                     # Utility libraries
│   ├── async.ts             # Async utilities (catchAsync)
│   ├── errors.ts            # Custom error classes
│   ├── timeout.ts           # Timeout utilities
│   └── validation.ts        # Validation helpers
├── middlewares/             # Express middlewares
│   ├── auth.middleware.ts   # JWT authentication
│   ├── error.middleware.ts  # Global error handling
│   └── validate.middleware.ts # Request validation
├── modules/                 # Feature modules
│   ├── auth/v1/            # Authentication endpoints
│   ├── users/v1/           # User management endpoints
│   └── eth/                # Blockchain integration
│       ├── shared/         # Shared blockchain utilities
│       └── tx/v1/          # Transaction endpoints
├── queue/                   # Background job processing
├── types/                   # TypeScript type definitions
└── tests/                   # Test suites
    ├── unit/               # Unit tests
    └── integration/        # Integration tests
```

### Architecture Patterns

#### 1. **Modular Architecture**

- **Feature-based modules**: Each feature (auth, users, blockchain) has its own module
- **Versioned APIs**: Support for API versioning (`v1`, `v2`) for backward compatibility
- **Separation of concerns**: Clear separation between controllers, services, repositories, and DTOs

#### 2. **Layered Architecture**

```
┌─────────────────┐
│   Controllers   │ ← HTTP request/response handling
├─────────────────┤
│    Services     │ ← Business logic
├─────────────────┤
│  Repositories   │ ← Data access layer
├─────────────────┤
│    Database     │ ← PostgreSQL + Prisma ORM
└─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Port 6379)   │
                    └─────────────────┘
                    
```

#### 3. **Middleware Pipeline**

```
Request → Security → CORS → Rate Limiting → Validation → Auth → Controller → Response
```

### Database Architecture

#### **PostgreSQL Schema**

- **Users**: User accounts with authentication data
- **Transactions**: Ethereum transaction records
- **Coverage**: Block range coverage tracking for efficient querying
- **AddressInfo**: Contract/EOA detection cache for performance

#### **Prisma ORM Integration**

- Type-safe database operations
- Automatic migration management
- Database introspection and client generation

### Caching Strategy

#### **3-Tier Caching Architecture**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Redis    │ →  │  Database   │ →  │  Provider   │
│  (Tier 1)   │    │  (Tier 2)   │    │  (Tier 3)   │
│ Sub-ms      │    │  1-5ms      │    │  100-500ms  │
└─────────────┘    └─────────────┘    └─────────────┘
```

- **Tier 1 (Redis)**: High-speed cache with TTL-based expiration
- **Tier 2 (Database)**: Persistent storage for cache misses
- **Tier 3 (Provider)**: Expensive blockchain provider calls as last resort

### Blockchain Integration

#### **Smart Contract Detection**

- Binary search algorithm for efficient contract creation block discovery
- Automatic address type detection (Contract vs EOA)
- Optimized transaction querying based on address type

#### **Transaction Processing**

- **Cache-First Strategy**: Check Redis cache for paginated query results first
- **Gap Detection**: Analyse database coverage to find missing block ranges
- **Smart Routing**:
    - **No gaps**: Serve directly from the database (complete coverage)
    - **Gaps found**: Fetch from Etherscan API and schedule background processing
- **Background Processing**: Queue gaps using BullMQ for asynchronous database filling
- **Fallback Strategy**: If Etherscan fails, serve incomplete data from the database

#### **Provider Management**

- Multiple provider support (Etherscan API + Direct RPC)
- Automatic fallback and retry mechanisms
- Rate limiting and timeout handling

### Security Architecture

#### **Authentication & Authorization**

- JWT-based stateless authentication
- Refresh token rotation for enhanced security
- Secure password hashing with bcrypt

#### **Security Middlewares**

- **Helmet**: Security headers protection
- **CORS**: Cross-origin request handling
- **Rate Limiting**: DoS protection
- **Input Validation**: Zod schema validation
- **HPP**: HTTP Parameter Pollution protection

### Monitoring & Logging

#### **Structured Logging**

- Winston logger with environment-specific configuration
- Scoped loggers for different components (API, Queue, etc.)
- JSON structured logging for production

#### **Health Monitoring**

```json
// Health check response
{
  "status": "ok",
  "mode": "development",
  "uptime": 3600,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ethereum": "connected"
  }
}
```

### 🔧 Development Experience

#### **Type Safety**

- **Full TypeScript**: 100% TypeScript implementation with strict mode
- **Schema Validation**: Runtime type checking with Zod
- **Database Types**: Auto-generated Prisma types for type-safe database operations

#### **Developer Tools**

- **Hot Reloading**: Instant development server restart on code changes
- **Interactive Documentation**: Swagger UI for API exploration
- **Database GUI**: Prisma Studio for database management
- **Comprehensive Testing**: Unit and integration test suites

#### **Code Quality**

- **ESLint**: Consistent code style and error detection
- **Prettier**: Automatic code formatting
- **Git Hooks**: Pre-commit validation and formatting

## ⚙️ Core Functionality

### 🔐 Authentication System

#### **JWT-Based Authentication**

- **Hybrid Design**: Access tokens are stateless, but refresh tokens are tracked in the database
- **Token Pair**: Access tokens (short-lived) + Refresh tokens (long-lived, stored in DB)
- **Manual Refresh**: Clients must explicitly call `/auth/refresh` endpoint to get new tokens
- **Session Management**: Access tokens contain `sid` (session ID) linking to refresh token
- **Revocation Tracking**: Revoked refresh tokens stored in the database for security
- **Multi-Device Support**: Users can be logged in on multiple devices up to 5 active sessions
- **Secure Logout**: Individual and global logout capabilities

#### **Password Security**

- **bcrypt Hashing**: Industry-standard password hashing with configurable salt rounds
- **Password Validation**: Strong password requirements enforced
- **Secure Storage**: Passwords never stored in plain text

### 👤 User Management

#### **Profile Management**

- **User Registration**: Email/username-based account creation
- **Profile Updates**: Secure profile modification with validation
- **Password Changes**: Secure password update with current password verification

#### **Data Validation**

- **Zod Schemas**: Type-safe request/response validation
- **Input Sanitization**: Protection against malicious input
- **Error Handling**: Detailed validation error messages

### ⛓️ Blockchain Integration

#### **Ethereum Address Support**

- **Address Validation**: Automatic checksum format validation and conversion
- **Contract Detection**: Smart detection of contract vs EOA addresses
- **Multi-Network**: Designed for Sepolia testnet with mainnet extensibility

#### **Transaction Querying**

```typescript
// Actual transaction processing flow
const getTransactions = async (address: string, fromBlock: number = 0) => {
  // 1. Check cache first
  const cached = await getCachedPaginatedTransactionQuery(address, fromBlock, toBlock, page, limit, order);
  if (cached) return cached;

  // 2. Resolve starting block with 3-tier caching
  const addressInfo = await resolveStartingBlock(address);
  const actualFrom = fromBlock === 0
    ? getStartingBlockFromInfo(addressInfo)
    : Math.max(fromBlock, getStartingBlockFromInfo(addressInfo));

  // 3. Check for gaps in database coverage
  const gaps = findGapsInCoverage(coverageRanges, actualFrom, actualTo, address);

  if (gaps.length === 0) {
    // No gaps - serve from database
    return await fetchTransactionsFromDatabase(address, actualFrom, actualTo, page, limit, order);
  } else {
    // Gaps found - fetch from Etherscan and queue background processing
    const result = await fetchTransactionsFromEtherscan(address, actualFrom, actualTo, page, limit, order);
    processGapsInBackground(address, gaps); // Queue for BullMQ processing
    return result || await fetchTransactionsFromDatabase(address, actualFrom, actualTo, page, limit, order, {incomplete: true});
  }
};
```

#### **Smart Gap Processing**

- **Gap Detection**: Identifies missing block ranges in database coverage
- **Immediate Response**: Always serve data immediately (from Etherscan or database)
- **Background Filling**: All gaps are queued for background processing using BullMQ
- **Coverage Tracking**: Maintains block range coverage to avoid redundant queries
- **No Size Threshold**: All gaps are processed in background regardless of size

#### **Performance Optimizations**

- **Contract Creation Detection**: Binary search to find contract deployment block
- **Batch Processing**: Efficient batch queries to external APIs
- **Intelligent Caching**: Multi-tier caching reduces provider calls by 99%+

### 🚀 Caching System

#### **Redis-Based Caching**

```typescript
// 3-tier caching strategy for address info
const resolveStartingBlock = async (address: string) => {
  // Tier 1: Redis cache (sub-millisecond)
  const cached = await getCachedAddressInfo(address);
  if (cached) return cached;

  // Tier 2: Database cache (1-5ms)
  const stored = await getAddressInfoFromDB(address);
  if (stored) {
    await setCachedAddressInfo(address, stored);
    return stored;
  }

  // Tier 3: Blockchain discovery (100-500ms)
  const discovered = await discoverAddressInfo(address);
  await Promise.all([
    saveAddressInfoToDB(address, discovered),
    setCachedAddressInfo(address, discovered)
  ]);
  return discovered;
};
```

#### **Cache Strategies**

- **Balance Caching**: 30-second TTL for ETH balances
- **Transaction Caching**: 5-minute TTL for transaction queries
- **Address Info Caching**: 7-day TTL for contract/EOA detection
- **Automatic Invalidation**: Smart cache invalidation on data updates

### 🔄 Background Processing

#### **Event Loop Processing**

- **Non-Blocking**: Uses Node.js event loop for background tasks
- **Progress Tracking**: Real-time progress updates for long-running operations
- **Error Recovery**: Graceful error handling and retry mechanisms

#### **Queue System Architecture**

```typescript
// Background processing using BullMQ
export function processGapsInBackground(address: string, gaps: Gap[]): void {
  if (gaps.length === 0) return;

  // Schedule background processing using setImmediate for non-blocking behaviour
  setImmediate(() => {
    queueGapsForProcessing(address, gaps)
      .then(() => {
        logger.info('Successfully queued gaps for processing', {address, gapsCount: gaps.length});
      })
      .catch((error) => {
        logger.error('Failed to queue gaps for processing', {address, error: error.message});
      });
  });
}
```

### 🛡️ Error Handling

#### **Comprehensive Error Management**

- **Custom Error Classes**: Structured error hierarchy for different error types
- **Global Error Handler**: Centralized error processing and logging
- **Graceful Degradation**: System continues operating even when components fail

#### **Error Types**

```typescript
// Custom error classes for different scenarios with convenient methods for common errors
export class ApiError extends Error {
  public statusCode: number;
  public errorName: string;
  public details?: Record<string, unknown | null>;

  constructor(statusCode: number, errorName: string, message: string, details?: Record<string, unknown | null>) {
    super(message);
    this.statusCode = statusCode;
    this.errorName = errorName;
    this.details = details;
  }

  static badRequest(message: string, details?: Record<string, unknown | null>) {
    return new ApiError(400, 'Bad Request', message, details);
  }

  static unauthorized(message: string, details?: Record<string, unknown | null>) {
    return new ApiError(401, 'Unauthorized', message, details);
  }

  // ...
}

export class JwtTokenError extends Error {
  constructor(
    public originalError: jwt.TokenExpiredError | jwt.NotBeforeError | jwt.JsonWebTokenError,
    public tokenType: 'access' | 'refresh'
  ) {
    super(originalError.message);
  }
}
```

### 📊 Monitoring & Observability

#### **Structured Logging**

- **Winston Logger**: Production-ready logging with multiple transports
- **Log Levels**: Debug, Info, Warn, Error with environment-specific configuration
- **Performance Metrics**: Response times and operation durations

#### **Health Monitoring**

```json
// Health check response
{
  "status": "ok",
  "mode": "development",
  "uptime": 3600,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🚀 Getting Started

Ready to explore the API? Here's a quick start:

1. **Start the application**: `docker-compose up --build`
2. **Explore the API**: Visit http://localhost:8000/api-docs
3. **Register a user**: Use the `/api/v1/auth/register` endpoint
4. **Query blockchain data**: Try `/api/v1/eth/address/{address}/transactions`
