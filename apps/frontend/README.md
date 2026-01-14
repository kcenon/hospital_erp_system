# Hospital ERP System - Frontend

A Next.js frontend application for the Hospital Inpatient Management ERP System.

## Features

- **Authentication**: Login page with form validation and automatic token refresh
- **Protected Routes**: Route middleware and client-side auth guards
- **Patient Management**: Patient list and detail views
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [React Query](https://tanstack.com/query) - Server state management
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://zod.dev/) - Schema validation
- [Radix UI](https://www.radix-ui.com/) - Accessible UI primitives

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# From the monorepo root
pnpm install

# Or from this directory
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser.

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env.local` file based on `env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login)
│   └── (dashboard)/       # Protected dashboard routes
├── components/
│   ├── auth/              # Auth components (AuthGuard, ChangePasswordModal)
│   ├── features/          # Feature-specific components
│   ├── layouts/           # Layout components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   └── validations/       # Zod schemas
├── providers/             # React providers
├── services/              # API service functions
├── stores/                # Zustand stores
└── types/                 # TypeScript type definitions
```

## Authentication Flow

1. User accesses a protected route
2. `AuthGuard` checks authentication state
3. Unauthenticated users are redirected to `/login`
4. On successful login, tokens are stored in Zustand (persisted to localStorage)
5. API client automatically attaches tokens to requests
6. On 401 responses, token refresh is attempted automatically
