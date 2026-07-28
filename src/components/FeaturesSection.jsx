
import React from 'react';
import { Users, ArrowLeftRight, FileText, CheckCircle2 } from 'lucide-react'; // Assuming these are the icons used

// Helper icon, assuming it's not already imported elsewhere. If it is, this can be removed.
const ArrowRightCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 16 16 12 12 8" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);


// New Features Section (replaces HowItWorks)
const FeaturesSection = () => {
  const features = [
    {
      icon: <Users size={32} className="text-blue-600 dark:text-primary" />,
      title: "Member Management",
      description: "Streamline onboarding and offboarding with secure digital signatures via Yousign integration.",
    },
    {
      icon: <ArrowLeftRight size={32} className="text-blue-600 dark:text-primary" />,
      title: "Share Transactions",
      description: "Manage share distribution with fixed pricing and transparent transaction histories.",
    },
    {
      icon: <FileText size={32} className="text-blue-600 dark:text-primary" />,
      title: "Compliance Reporting",
      description: "AI-powered tools generate meeting agendas and compliance reports automatically.",
    },
  ];

  const recentTransactions = [
    { type: "Purchase", date: "Apr 12, 2023", shares: "+2 Shares", color: "text-green-500" },
    { type: "Purchase", date: "Feb 20, 2023", shares: "+5 Shares", color: "text-green-500" },
    { type: "Initial Investment", date: "Jan 15, 2023", shares: "+5 Shares", color: "text-green-500" },
    // Example of a sell transaction for visual variety
    // { type: "Sale", date: "May 01, 2023", shares: "-3 Shares", color: "text-red-500" },
  ];

  return (
    <section id="features" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Simplify Your Cooperative Management
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our platform streamlines administrative tasks, enhances transparency, and fosters democratic participation.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-12 items-start">
          {/* Left Column: Feature descriptions */}
          <div className="lg:col-span-3 space-y-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02] animate-fade-in-left"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-tint dark:bg-primary-dark-900 mr-4">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Share Transactions Panel */}
          <div className="lg:col-span-2 mt-12 lg:mt-0 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-xl animate-fade-in-right animation-delay-400">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Share Transactions</h3>

            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Your Share Balance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">12 <span className="text-lg font-normal">Shares</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Value: €1,200</p> {/* Using € as per new image */}
              <div className="mt-4 flex space-x-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150">
                  Buy Shares
                </button>
                <button className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150">
                  Sell Shares
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Transactions</h4>
              <ul className="space-y-3">
                {recentTransactions.map((transaction, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm transition-opacity duration-300 ease-in-out opacity-0 animate-list-item"
                    style={{ animationDelay: `${index * 100 + 600}ms` }} // Staggered animation for list items
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</p>
                    </div>
                    <p className={`text-sm font-semibold ${transaction.color}`}>{transaction.shares}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      
      </div>
    </section>
  );
};

export default FeaturesSection;