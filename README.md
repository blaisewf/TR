# TR Web Application

A modern web application built with Next.js, TypeScript, Tailwind CSS, and Supabase integration.

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Animation**: Framer Motion
- **Package Manager**: pnpm

## Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm (Latest version)
- Supabase account and project

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/blaisewf/TR.git
cd TR
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`