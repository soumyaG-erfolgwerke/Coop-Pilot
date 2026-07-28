"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-primary/80 transition-colors duration-150"
      >
        <span>{question}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      {isOpen && (
        <div className="mt-3 text-gray-600 dark:text-gray-300 animate-fade-in"> {/* Simple fade-in for answer */}
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};


const FAQ = () => {
  const faqs = [
    {
      question: "What is CooperativeStreamline?",
      answer: "CooperativeStreamline is an all-in-one platform designed to help cooperatives manage their members, finances, projects, and communications efficiently.",
    },
    {
      question: "How secure is my data?",
      answer: "We take data security very seriously. Our platform uses industry-standard encryption, regular backups, and robust security measures to protect your information.",
    },
    {
      question: "Can I customize the platform to fit my cooperative\'s specific needs? Schlagwörter: Anpassen, Anforderungen",
      answer: "Yes, our Pro and Enterprise plans offer various customization options. For specific requirements, please contact our sales team.",
    },
    {
      question: "Is there a trial period available? Schlagwörter: Testen, Kostenlos",
      answer: "Yes, we offer a 14-day free trial for our Basic and Pro plans. No credit card required to get started.",
    },
     {
      question: "What kind of support do you offer? Schlagwörter: Hilfe, Kundenservice",
      answer: "We offer email support for all plans. Pro and Enterprise plans include priority support and dedicated account managers, respectively.",
    },
  ];

  return (
    <section id="faq" className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in-down">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Find answers to common questions about our platform.
          </p>
        </div>
        <div className="mt-12 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="animate-fade-in-up"
              style={{animationDelay: `${index * 100}ms`}}
            >
              <FAQItem question={faq.question} answer={faq.answer} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;