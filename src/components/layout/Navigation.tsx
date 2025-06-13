'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 rounded-full px-2 py-1.5 shadow-lg">
        <div className="flex space-x-1">
          <Link
            href="/"
            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              pathname === '/'
                ? 'text-white bg-gray-700/50'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Home
          </Link>
          <Link
            href="/leaderboard"
            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              pathname === '/leaderboard'
                ? 'text-white bg-gray-700/50'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </nav>
  );
} 