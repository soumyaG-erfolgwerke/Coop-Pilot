
import React from 'react';

// TrustedBy Section
const TrustedBy = () => {
  const logos = ["Company A", "Enterprise B", "Org C", "Startup D", "Corp E"];
  return (
    <section id="trusted-by" className="py-12 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider animate-fade-in-up">
          Trusted by over 100+ companies
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="col-span-1 flex justify-center py-4 px-2 bg-gray-50 dark:bg-gray-800 rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-gray-700 dark:text-gray-300">{logo}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;