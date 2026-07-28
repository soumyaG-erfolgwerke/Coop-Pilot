import React from 'react';

// CTA Section
const CTA = () => (
  <section id="cta" className="py-16 bg-md-tint dark:bg-primary">
    <div className="container px-4 mx-auto text-center sm:px-6 lg:px-8 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
        Ready to Transform Your Cooperative?
      </h2>
      <p className="mt-4 text-lg text-tint dark:text-blue-200">
        Join hundreds of cooperatives already benefiting from a streamlined management experience.
      </p>
      <div className="mt-8">
        <a
          href="#get-started"
          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-blue-700 transition-transform duration-200 bg-white border border-transparent rounded-md hover:bg-blue-50 hover:scale-105"
        >
          Get Started for Free
        </a>
      </div>
    </div>
  </section>
);

export default CTA;