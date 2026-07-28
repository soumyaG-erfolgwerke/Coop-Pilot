
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "$19",
      frequency: "/month",
      features: ["Up to 50 members", "Basic reporting", "Email support", "Project tracking (limited)"],
      buttonText: "Choose Plan",
      popular: false,
    },
    {
      name: "Pro",
      price: "$49",
      frequency: "/month",
      features: [
        "Up to 200 members",
        "Advanced reporting",
        "Priority email support",
        "Full project management",
        "Member portal",
      ],
      buttonText: "Choose Plan",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Contact Us",
      frequency: "",
      features: [
        "Unlimited members",
        "Custom reporting",
        "Dedicated support manager",
        "API Access & Integrations",
        "Custom onboarding",
      ],
      buttonText: "Contact Us",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in-down">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Flexible Plans for Every Cooperative
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Choose the plan that best fits your cooperative's size and needs.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl ${plan.popular ? 'border-2 border-blue-600 dark:border-primary relative hover:scale-105' : 'border dark:border-gray-700 hover:scale-[1.02]'} animate-fade-in-up`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs text-white bg-blue-600 dark:bg-primary rounded-full font-semibold uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                {plan.frequency && <span className="text-base font-medium text-gray-500 dark:text-gray-400">{plan.frequency}</span>}
              </div>
              <ul className="mt-6 space-y-3 text-gray-600 dark:text-gray-300 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 size={20} className="flex-shrink-0 text-green-500 mr-2 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <a
                  href="#"
                  className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors duration-150 ${
                    plan.popular
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-blue-700 dark:text-primary/80 bg-tint dark:bg-primary-dark-800 hover:bg-blue-200 dark:hover:bg-blue-700'
                  }`}
                >
                  {plan.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;