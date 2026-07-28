
import React from 'react';

// Testimonial Section
const Testimonial = () => (
  <section id="testimonial" className="py-16 bg-gray-50 dark:bg-gray-800">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
        <div className="lg:col-span-7 animate-fade-in-left">
          <blockquote className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-xl transform transition-all duration-500 hover:scale-105">
            <p className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
              "This platform has revolutionized how we manage our cooperative. It's intuitive, powerful, and has saved us countless hours. The support team is also fantastic!"
            </p>
            <footer className="mt-6">
              <p className="text-base font-medium text-gray-700 dark:text-gray-200">Jane Doe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manager at GreenValley Co-op</p>
            </footer>
          </blockquote>
        </div>
        <div className="mt-10 lg:mt-0 lg:col-span-5 animate-fade-in-right animation-delay-200">
          <div className="bg-gray-200 dark:bg-gray-600 rounded-lg shadow-xl aspect-square flex items-center justify-center overflow-hidden">
             <img
              src="https://placehold.co/400x400/E2E8F0/4A5568?text=Happy+Client"
              alt="Happy Client"
              className="rounded-lg object-cover w-full h-full transform transition-transform duration-500 hover:scale-110"
              onError={(e) => e.target.src = 'https://placehold.co/400x400/cccccc/333333?text=Image+Error'}
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Testimonial;