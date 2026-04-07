# Estate Bridge - Frontend

React + TypeScript frontend for the Estate Bridge real estate platform.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Redux Toolkit** - Global state management
- **React Query** - Server state management and caching
- **Axios** - HTTP client
- **Firebase** - Authentication and real-time database
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Common components (Button, Input, etc.)
│   ├── layout/      # Layout components (Header, Footer, Sidebar)
│   ├── property/    # Property-related components
│   ├── auth/        # Authentication components
│   └── dashboard/   # Dashboard components
├── pages/           # Route-level page components
├── features/        # Feature-based modules (Redux slices)
├── services/        # API service layer
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── config/          # Configuration files
└── constants/       # Application constants
```

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your Firebase credentials and API URL

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Code Quality

### Linting

The project uses ESLint with TypeScript and React plugins. Run linting:
```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint:fix
```

### Formatting

The project uses Prettier for code formatting. Format code:
```bash
npm run format
```

Check formatting:
```bash
npm run format:check
```

### Type Checking

Run TypeScript type checking:
```bash
npm run type-check
```

## Environment Variables

Required environment variables (see `.env.example`):

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## Features

- User authentication (buyer/seller roles)
- Property listing management (sellers)
- Property search and browsing (buyers)
- Appointment scheduling
- Feedback and reviews
- AI-powered support chat
- Role-based dashboards
- Real-time updates with Firestore

## Contributing

1. Follow the existing code style
2. Run linting and formatting before committing
3. Ensure type checking passes
4. Write meaningful commit messages

## License

Private - Estate Bridge Platform
