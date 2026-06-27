import { motion } from 'framer-motion'

/** Fade/slide content in as it scrolls into view. Consistent motion language. */
export function Reveal({ children, delay = 0, y = 14, className, once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
