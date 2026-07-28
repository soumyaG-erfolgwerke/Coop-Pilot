
import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  const footerLinks = [
    { name: "About", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ];
  const socialLinks = [
    { name: "Facebook", icon: <Facebook size={24} />, href: "#" },
    { name: "Twitter", icon: <Twitter size={24} />, href: "#" },
    { name: "LinkedIn", icon: <Linkedin size={24} />, href: "#" },
    { name: "Instagram", icon: <Instagram size={24} />, href: "#" },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
             <a href="#" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-primary">CoopStream</h1>
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Making cooperative management simple and efficient.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-150">
                  <span className="sr-only">{social.name}</span>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Solutions</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">Member Management</a></li>
                  <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">Financial Tracking</a></li>
                  <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">Project Collaboration</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Company</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerLinks.map((link) => (
                     <li key={link.name}>
                       <a href={link.href} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">
                         {link.name}
                       </a>
                     </li>
                  ))}
                </ul>
              </div>
            </div>
             <div className="md:grid md:grid-cols-1 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Legal</h3>
                  <ul role="list" className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">Claim</a></li>
                    <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">Privacy</a></li>
                    <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">Terms</a></li>
                  </ul>
                </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-base text-gray-400 dark:text-gray-500 xl:text-center">
            &copy; {new Date().getFullYear()} CoopStream. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;