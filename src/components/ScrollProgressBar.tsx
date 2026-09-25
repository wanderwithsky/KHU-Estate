import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  
  // Use spring physics for smoother animation without reflows
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] md:h-[3px] bg-brand-gold origin-left z-[9999]"
      style={{ 
        scaleX,
        boxShadow: '0 0 8px rgba(201,162,109,0.6)' // Subtle glow
      }}
    />
  );
}
