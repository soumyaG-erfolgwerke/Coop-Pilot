"use client";

import React from 'react';
import Link from 'next/link';
import { Home, Search, FileX2 } from 'lucide-react';

// You can copy and paste this component directly into your project.
// Make sure you have lucide-react and tailwindcss installed.

const NotFoundPage = () => {
    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
            <style>
                {`
                    @keyframes drop {
                        0% { transform: translateY(-100px) scale(1); opacity: 1; }
                        100% { transform: translateY(150px) scale(0.3); opacity: 0; }
                    }
                    @keyframes search-move {
                       0%, 100% { transform: translate(10px, -10px) rotate(15deg); }
                       50% { transform: translate(-10px, 10px) rotate(-15deg); }
                    }

                    .paper-shred {
                        position: absolute;
                        width: 8px;
                        height: 4px;
                        background: #cbd5e1;
                        border-radius: 2px;
                    }
                    .paper-shred.shred-1 { animation: drop 3s ease-in-out infinite; animation-delay: 0.5s; left: 40%; }
                    .paper-shred.shred-2 { animation: drop 3s ease-in-out infinite; animation-delay: 1.2s; left: 50%; }
                    .paper-shred.shred-3 { animation: drop 3s ease-in-out infinite; animation-delay: 2s; left: 60%; }

                    .icon-search-anim {
                        animation: search-move 4s ease-in-out infinite;
                    }
                `}
            </style>

            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Shredded paper animation */}
                <div className="paper-shred shred-1"></div>
                <div className="paper-shred shred-2"></div>
                <div className="paper-shred shred-3"></div>

                {/* Main Icon */}
                <FileX2 className="relative w-48 h-48 text-gray-300 dark:text-gray-600" strokeWidth={0.5} />
                <Search className="absolute w-20 h-20 text-primary icon-search-anim" strokeWidth={1} />
            </div>

            <div className="text-center z-10">
                <h1 className="text-6xl sm:text-8xl font-bold text-gray-800 dark:text-gray-200">
                    404
                </h1>
                <p className="mt-4 text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300">
                    Document Not Found
                </p>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    The page or file you are looking for doesn't exist, has been moved, or the link is broken.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-transform transform hover:scale-105 shadow-lg"
                    >
                        <Home className="mr-2" size={20} />
                        Return to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </div>

             <div className="absolute bottom-4 text-xs text-gray-500 dark:text-gray-600">
                CoopStream &copy; 2025
            </div>
        </div>
    );
};

export default NotFoundPage;
