import React from 'react';
import { Users, Target, Eye, Zap, ShieldCheck, Award, Linkedin, Twitter, Briefcase } from 'lucide-react';

// Helper component for Team Member cards
const TeamMemberCard = ({ imageSrc, name, title, bio, socialLinks }) => {
  // Fallback image if imageSrc is not provided or fails to load
  const placeholderImage = `https://placehold.co/400x400/E0E7FF/4F46E5?text=${name.split(' ').map(n=>n[0]).join('')}`;
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
      <img 
        src={imageSrc || placeholderImage} 
        alt={name} 
        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-primary dark:border-primary/80"
        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
      />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{name}</h3>
      <p className="text-blue-600 dark:text-primary/80 mb-2">{title}</p>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{bio}</p>
      {socialLinks && (
        <div className="flex justify-center space-x-3">
          {socialLinks.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 dark:hover:text-primary">
              <Linkedin size={20} />
            </a>
          )}
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary dark:hover:text-primary/80">
              <Twitter size={20} />
            </a>
          )}
           {socialLinks.portfolio && (
            <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <Briefcase size={20} />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Helper component for Value items
const ValueItem = ({ icon, title, children }) => {
  const IconComponent = icon;
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <IconComponent className="h-7 w-7 text-blue-600 dark:text-primary" />
      </div>
      <div className="ml-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{children}</p>
      </div>
    </div>
  );
};


const AboutUs = () => {
  const teamMembers = [
    {
      imageSrc: 'https://placehold.co/400x400/E0E7FF/4F46E5?text=JD', // Replace with actual image URLs
      name: 'Jane Doe',
      title: 'Founder & CEO',
      bio: 'Visionary leader with a passion for empowering cooperatives through technology.',
      socialLinks: { linkedin: '#', twitter: '#', portfolio: '#' }
    },
    {
      imageSrc: 'https://placehold.co/400x400/D1FAE5/059669?text=JS',
      name: 'John Smith',
      title: 'Chief Technology Officer',
      bio: 'Expert in building scalable and secure platforms for collaborative success.',
      socialLinks: { linkedin: '#', twitter: '#' }
    },
    {
      imageSrc: 'https://placehold.co/400x400/FEF3C7/D97706?text=AL',
      name: 'Alice Lee',
      title: 'Head of Community',
      bio: 'Dedicated to fostering a supportive and engaged network of cooperatives.',
      socialLinks: { linkedin: '#', portfolio: '#' }
    },
     {
      imageSrc: 'https://placehold.co/400x400/FEE2E2/DC2626?text=RB',
      name: 'Robert Brown',
      title: 'Lead Product Designer',
      bio: 'Crafting intuitive and user-friendly experiences for cooperative management.',
      socialLinks: { linkedin: '#', twitter: '#', portfolio: '#' }
    }
  ];

  return (
    <section id="about-us" className="py-16 bg-white dark:bg-gray-900 font-inter">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <div className="text-center mb-16 lg:mb-20">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            About CooperativeStreamline
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Empowering cooperatives with innovative solutions for seamless management, democratic participation, and sustainable growth.
          </p>
        </div>

        {/* Our Story Section */}
        <div className="mb-16 lg:mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-6">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              CooperativeStreamline was born from a simple idea: to make cooperative management easier, more transparent, and accessible to all. We saw the challenges cooperatives faced with outdated tools and complex processes, and we knew there had to be a better way.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Driven by a commitment to the cooperative principles, we embarked on a mission to build a platform that not only streamlines operations but also strengthens the very fabric of cooperative communities. Today, we are proud to support a growing network of cooperatives in achieving their goals.
            </p>
          </div>
        </div>

        {/* Mission and Values Section */}
        <div className="mb-16 lg:mb-20 bg-gray-50 dark:bg-gray-800 py-12 px-6 sm:px-10 rounded-xl shadow-lg">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-6">
                Our Mission & Core Values
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Our mission is to provide cooperatives with the most effective and user-friendly tools to thrive in a dynamic world, fostering collaboration, transparency, and efficiency.
              </p>
            </div>
            <div className="space-y-6">
              <ValueItem icon={Target} title="Empowerment">
                We empower cooperatives by providing tools that enhance their autonomy and decision-making capabilities.
              </ValueItem>
              <ValueItem icon={Eye} title="Transparency">
                We champion open communication and clear processes to build trust and accountability within cooperatives.
              </ValueItem>
              <ValueItem icon={Zap} title="Efficiency">
                We streamline administrative tasks to save time and resources, allowing cooperatives to focus on their core mission.
              </ValueItem>
              <ValueItem icon={Users} title="Collaboration">
                 We foster a spirit of teamwork and mutual support, enabling members to work together seamlessly.
              </ValueItem>
            </div>
          </div>
        </div>
        
        {/* Meet Our Team Section */}
        <div className="mb-16 lg:mb-20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl text-center mb-12">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <TeamMemberCard
                key={index}
                imageSrc={member.imageSrc}
                name={member.name}
                title={member.title}
                bio={member.bio}
                socialLinks={member.socialLinks}
              />
            ))}
          </div>
        </div>

        {/* Our Commitment Section */}
        <div className="text-center bg-blue-600 dark:bg-primary-dark-700 text-white py-12 px-6 sm:px-10 rounded-xl shadow-lg">
           <Award size={48} className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            Our Commitment to You
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-6">
            We are dedicated to continuously improving CooperativeStreamline, working hand-in-hand with the cooperative community to build a future where every cooperative can flourish. Your success is our success.
          </p>
          <button className="px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-blue-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white transition-colors transform hover:scale-105">
            Get In Touch
          </button>
        </div>

      </div>
    </section>
  );
};

export default AboutUs;
