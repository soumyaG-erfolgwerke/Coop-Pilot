
import React from 'react';

// Stats Section
const Stats = () => {
  const statsData = [
    { value: "10K+", label: "Active Users" },
    { value: "50K+", label: "Downloads" },
    { value: "98%", label: "Positive Reviews" },
  ];
  return (
    <section id="stats" className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {statsData.map((stat, index) => (
            <div
              key={stat.label}
              className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <p className="text-4xl font-bold text-blue-600 dark:text-primary">{stat.value}</p>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;