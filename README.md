# Color Perception Game

A modern web application designed to evaluate and enhance users’ color differentiation abilities. Built with a high-performance stack including **Next.js**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org)
* **Language:** [TypeScript](https://www.typescriptlang.org)
* **Styling:** [Tailwind CSS](https://tailwindcss.com)
* **Backend:** [Supabase](https://supabase.com)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **Package Manager:** [pnpm](https://pnpm.io)

## Prerequisites

* Node.js (LTS recommended)
* pnpm (latest version)
* Supabase account and project

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/blaisewf/TR.git
cd TR
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database Schema

Create a `data` table in your Supabase project with the following schema:

| Column Name                | Type          |
| -------------------------- | ------------- |
| `session_id`               | `uuid`        |
| `player_id`                | `uuid`        |
| `saved_at`                 | `timestamptz` |
| `total_time`               | `float4`      |
| `final_level`              | `int2`        |
| `rounds`                   | `json`        |
| `device_info`              | `jsonb`       |
| `has_visibility_condition` | `bool`        |


### 5. Run the Development Server

```bash
pnpm dev
```

The application will be available at:
[http://localhost:3000](http://localhost:3000)


## Production

To build and start the application in production mode:

```bash
pnpm build
pnpm start
```

## License

This project is licensed under the [MIT License](LICENSE).
