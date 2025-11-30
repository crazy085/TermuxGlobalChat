# DirectChat - Person-to-Person Messaging Application

## Overview

DirectChat is a real-time person-to-person messaging application inspired by WhatsApp, Telegram, and Signal. The application provides a clean, messaging-first interface for direct communication between users with features including real-time message delivery, read receipts, and contact management.

The application follows a modern full-stack architecture with a React-based frontend, Express backend, and WebSocket-powered real-time communication. It emphasizes simplicity, clarity, and mobile-responsiveness in its design approach.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast refresh and optimized builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and API data fetching

**UI Component System**
- Shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Design system based on Inter font family with systematic spacing and color tokens

**State Management Pattern**
- Local state for UI interactions using React hooks
- Server state managed through React Query with disabled automatic refetching
- WebSocket connection state maintained in component-level state
- localStorage for persisting user authentication (userId and username)

**Real-time Communication**
- WebSocket client connection for bidirectional messaging
- Message state synchronized through WebSocket events (message delivery, history loading)
- Automatic reconnection handling on page load with authentication handshake

### Backend Architecture

**Server Framework**
- Express.js for HTTP request handling and middleware
- Native Node.js HTTP server for WebSocket upgrade support
- Environment-based configuration (development vs production modes)

**Real-time Messaging Layer**
- WebSocket Server (ws library) mounted at `/ws` endpoint
- Connection-based client tracking using Map data structure (userId -> WebSocket)
- Message routing: messages sent directly to recipient's active WebSocket connection
- Authentication flow: clients send auth message with userId on connection

**API Design**
- RESTful endpoints for user management and authentication
- JSON request/response format with Zod schema validation
- Session-based or stateless authentication (implementation in progress)

**Data Validation**
- Zod schemas for runtime type validation
- Drizzle-Zod integration for automatic schema generation from database models
- Request body validation before database operations

### Data Storage Architecture

**Database Solution**
- PostgreSQL as the primary database (configured via Drizzle with Neon serverless driver)
- Drizzle ORM for type-safe database queries and schema management
- Schema-first approach with migrations stored in `/migrations` directory

**Database Schema**
1. **Users Table**
   - Primary key: UUID (auto-generated)
   - Username: unique text field
   - Password: plain text storage (security improvement needed)

2. **Messages Table**
   - Primary key: UUID (auto-generated)
   - Foreign keys: senderId and receiverId (references users)
   - Content: text field for message body
   - Timestamp: automatic timestamp on creation
   - Read status: boolean flag for read receipts

**Storage Abstraction**
- IStorage interface defining storage operations (users, messages)
- MemStorage implementation for in-memory development/testing
- Database implementation implied by Drizzle configuration
- Separation allows switching storage backends without changing business logic

### Authentication & Authorization

**Current Implementation**
- Username/password authentication with registration and login endpoints
- Password stored in plain text (security risk - needs hashing)
- User session persisted in browser localStorage
- No server-side session management or JWT tokens currently implemented

**Authorization Pattern**
- WebSocket authentication via initial auth message containing userId
- No middleware-based request authentication visible in routes
- Trust-based system relying on client-provided userId

### Design System Principles

**Mobile-First Responsive Design**
- Breakpoint at 768px separating mobile and desktop layouts
- Desktop: Two-column layout (sidebar + chat area)
- Mobile: Single-view navigation with toggle between contacts and messages
- Touch-optimized targets and spacing

**Typography Hierarchy**
- Contact names: semibold, base size
- Message text: normal weight, small size
- Timestamps: normal weight, extra small size
- Consistent Inter font stack with system fallbacks

**Color System**
- HSL-based color tokens for light mode
- Semantic naming (primary, secondary, muted, accent, destructive)
- Separate tokens for background, foreground, and borders
- CSS custom properties for theme flexibility

**Component Patterns**
- Contact list sidebar: fixed width on desktop (320px), full width on mobile
- Message bubbles: different styling for sent vs received (primary color vs card background)
- Read receipts: single check (sent) vs double check (read)
- Auto-scroll to latest message on new message arrival

## External Dependencies

### Core Runtime Dependencies

**Database & ORM**
- `@neondatabase/serverless` - Serverless PostgreSQL driver for Neon database
- `drizzle-orm` - TypeScript ORM for database operations
- `drizzle-zod` - Schema validation integration
- `connect-pg-simple` - PostgreSQL session store for Express (indicates session implementation)

**Real-time Communication**
- `ws` - WebSocket server implementation
- Native browser WebSocket API for client connections

**Frontend Framework & Routing**
- `react` and `react-dom` - UI framework
- `wouter` - Lightweight routing library
- `@tanstack/react-query` - Server state management

**UI Component Library**
- `@radix-ui/*` - Complete suite of accessible UI primitives (25+ components)
- `lucide-react` - Icon library
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant utilities
- `embla-carousel-react` - Carousel component

**Form & Validation**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Validation resolver integration
- `zod` - Runtime schema validation

**Utilities**
- `date-fns` - Date formatting and manipulation
- `clsx` and `tailwind-merge` - CSS class name utilities
- `nanoid` - Unique ID generation

### Development Dependencies

**Build & Development Tools**
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React integration for Vite
- `tsx` - TypeScript execution for development server
- `esbuild` - Production bundler for server code
- `@replit/vite-plugin-*` - Replit-specific development plugins

**Database Tools**
- `drizzle-kit` - Database migration and schema management CLI

**Type Checking**
- `typescript` - Static type checking
- `@types/node` - Node.js type definitions

### Third-Party Services

**Database Hosting**
- Neon Serverless PostgreSQL (indicated by driver choice)
- Connection via DATABASE_URL environment variable
- No embedded database - requires provisioned external database

**Font Hosting**
- Google Fonts CDN for Inter font family
- Preconnect optimization for performance

### API Integrations

Currently, the application appears to be self-contained with no external API integrations beyond:
- Database connection to PostgreSQL
- Font delivery from Google Fonts CDN

Future integration points may include:
- Email service for notifications or password reset
- File/image upload service for media sharing
- Push notification service for offline message delivery