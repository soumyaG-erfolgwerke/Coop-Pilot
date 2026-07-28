import React from 'react';
import { motion } from 'framer-motion';

const ComingSoon = () => {
  return (
    <motion.div
      className="text-center text-white text-2xl md:text-4xl font-semibold p-8 rounded-xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 shadow-lg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.p
        className="animate-pulse"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        🚧 Feature will come soon
      </motion.p>
    </motion.div>
  );
};

export default ComingSoon;
