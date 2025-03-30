import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const ScrollFadeIn = ({ children, className = '', once = true, amount = 0.2 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount }); // Trigger animation once when 20% is visible

  const variants = {
    hidden: { opacity: 0, y: 20 }, // Start slightly down and transparent
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6, // Animation duration
        ease: 'easeOut', // Animation easing
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className} // Allow passing custom classes
    >
      {children}
    </motion.div>
  );
};

export default ScrollFadeIn; 