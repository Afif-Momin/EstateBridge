# Estate Bridge Backend API

Industry-level real estate platform backend built with Express.js, TypeScript, and Firebase.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Testing**: Jest, Supertest, fast-check

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── middleware/      # Express middleware
├── validators/      # Request validation schemas
├── models/          # TypeScript interfaces/types
├── utils/           # Utility functions
├── config/          # Configuration management
├── constants/       # Application constants
└── types/           # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore, Auth, and Storage enabled
- Firebase service account credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Firebase credentials and configuration
```

### Environment Configuration

#### Required Environment Variables

1. **Firebase Configuration**
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_PRIVATE_KEY`: Service account private key (keep the \n characters)
   - `FIREBASE_CLIENT_EMAIL`: Service account email

   To get these credentials:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Extract the values from the downloaded JSON file

2. **reCAPTCHA Configuration**
   - `RECAPTCHA_V3_SITE_KEY`: reCAPTCHA v3 site key (for frontend)
   - `RECAPTCHA_V3_SECRET_KEY`: reCAPTCHA v3 secret key (for backend)
   - `RECAPTCHA_V2_SITE_KEY`: reCAPTCHA v2 site key (fallback)
   - `RECAPTCHA_V2_SECRET_KEY`: reCAPTCHA v2 secret key (fallback)

   To get reCAPTCHA keys:
   - Go to https://www.google.com/recaptcha/admin
   - Register your site with both v3 and v2 checkbox
   - Copy the site keys and secret keys

3. **AI API Configuration** (Optional - for AI support feature)
   - `AI_API_KEY`: Your OpenAI or compatible AI API key
   - `AI_API_URL`: AI API endpoint (default: https://api.openai.com/v1)

4. **Security Configuration**
   - `JWT_SECRET`: Random secret key for JWT signing (generate with: `openssl rand -base64 32`)
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

5. **Rate Limiting Configuration**
   - `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 900000 = 15 minutes)
   - `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 1000)
   - `RATE_LIMIT_AUTH_MAX_REQUESTS`: Max auth requests per window (default: 5)

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## API Documentation

API documentation is available at `/api/v1/docs` when running the server.

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT
