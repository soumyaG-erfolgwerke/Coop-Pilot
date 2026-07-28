
import React from 'react';

// Hero Section
const Hero = () => (
  <section id="hero" className="bg-gray-50 dark:bg-gray-800 py-16 sm:py-24">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
        <div className="lg:col-span-6 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white animate-fade-in-down">
            Streamline Your <span className="text-blue-600 dark:text-primary">Cooperative's</span> Operations
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 animate-fade-in-up animation-delay-300">
            Manage members, finances, and projects all in one place. Simplify your workflow and boost productivity.
          </p>
          <div className="mt-10 sm:flex sm:justify-center lg:justify-start animate-fade-in-up animation-delay-600">
            <div className="rounded-md shadow">
              <a
                href="#get-started"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-transform duration-200 hover:scale-105"
              >
                Get Started for Free
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 lg:mt-0 lg:col-span-6 animate-fade-in-right animation-delay-200">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow-xl aspect-video flex items-center justify-center overflow-hidden">
            <img
              src="https://placehold.co/600x400/E2E8F0/4A5568?text=Cooperative+Platform+UI"
              alt="Cooperative Platform UI Mockup"
              className="rounded-lg object-cover w-full h-full transform transition-transform duration-500 hover:scale-110"
              onError={(e) => e.target.src = 'https://placehold.co/600x400/cccccc/333333?text=Image+Error'}
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;