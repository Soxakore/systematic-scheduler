import { motion } from 'framer-motion';

const orbs = [
  { size: 300, x: '10%', y: '20%', color: '211 100% 50%', delay: 0 },
  { size: 200, x: '70%', y: '15%', color: '280 80% 60%', delay: 2 },
  { size: 250, x: '80%', y: '60%', color: '190 100% 70%', delay: 4 },
  { size: 180, x: '20%', y: '70%', color: '211 100% 50%', delay: 1 },
  { size: 220, x: '50%', y: '40%', color: '280 60% 50%', delay: 3 },
];

export default function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(${orb.color} / 0.15) 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
