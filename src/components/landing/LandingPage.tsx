import { motion } from 'framer-motion';
import { useOrchardStore } from '../../store/useOrchardStore';

/* ─── Floating Particle ─────────────────────────────────────────────────── */
function FloatingLeaf({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute text-green-400/20 pointer-events-none select-none"
      style={{ left: `${x}%`, top: '-5%', fontSize: `${size}rem` }}
      animate={{
        y: ['0vh', '110vh'],
        x: [0, Math.sin(delay) * 60],
        rotate: [0, 360],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{
        duration: 12 + delay * 2,
        repeat: Infinity,
        delay: delay,
        ease: 'linear',
      }}
    >
      🍃
    </motion.div>
  );
}

/* ─── Landing Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const setMode = useOrchardStore((s) => s.setMode);

  const leaves = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.2,
    x: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
  }));

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060e1a] flex flex-col items-center justify-center font-[Outfit,system-ui,sans-serif]">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(245,158,11,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_40%)]" />
      </div>

      {/* Floating Leaves */}
      {leaves.map((l, i) => (
        <FloatingLeaf key={i} {...l} />
      ))}

      {/* Brand Header */}
      <motion.div
        className="relative z-10 text-center mb-12 md:mb-16"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="text-5xl md:text-6xl mb-4 select-none"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          🌿
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            KhagraChori
          </span>
          <span className="text-slate-300 ml-3">Agro</span>
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-3 max-w-md mx-auto leading-relaxed">
          Farm-fresh fruits straight from the hills of Khagrachari.
          <br />
          Pick your experience below.
        </p>
      </motion.div>

      {/* Two Pathway Cards */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 px-6 max-w-4xl w-full">
        {/* Card: Visit the Orchard */}
        <motion.button
          className="group relative flex-1 rounded-3xl p-8 md:p-10 cursor-pointer border border-emerald-500/15 overflow-hidden text-left transition-all duration-500 bg-transparent"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('explore')}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/20 group-hover:from-emerald-800/50 group-hover:via-green-800/40 group-hover:to-teal-800/30 transition-all duration-500" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.2),transparent_60%)]" />
          
          {/* Glow border on hover */}
          <div className="absolute inset-0 rounded-3xl border border-emerald-400/0 group-hover:border-emerald-400/30 transition-all duration-500 shadow-none group-hover:shadow-[0_0_60px_-12px_rgba(16,185,129,0.3)]" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.span
                className="text-4xl md:text-5xl select-none"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                🌳
              </motion.span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-400/70 tracking-widest uppercase">3D Experience</span>
                <span className="text-2xl md:text-3xl font-extrabold text-white">Visit the Orchard</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Walk through our virtual farm, drive the harvest truck, and handpick your favourite fruits right from the trees.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
              <span>Enter the field</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </div>
          </div>

          {/* Decorative emojis */}
          <motion.div
            className="absolute -bottom-2 -right-2 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 select-none"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            🥭
          </motion.div>
        </motion.button>

        {/* Card: Browse the Shop */}
        <motion.button
          className="group relative flex-1 rounded-3xl p-8 md:p-10 cursor-pointer border border-amber-500/15 overflow-hidden text-left transition-all duration-500 bg-transparent"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('shop')}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-rose-900/20 group-hover:from-amber-800/50 group-hover:via-orange-800/40 group-hover:to-rose-800/30 transition-all duration-500" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_70%_30%,rgba(245,158,11,0.2),transparent_60%)]" />
          
          {/* Glow border on hover */}
          <div className="absolute inset-0 rounded-3xl border border-amber-400/0 group-hover:border-amber-400/30 transition-all duration-500 shadow-none group-hover:shadow-[0_0_60px_-12px_rgba(245,158,11,0.3)]" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.span
                className="text-4xl md:text-5xl select-none"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                🛒
              </motion.span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-400/70 tracking-widest uppercase">E-Commerce</span>
                <span className="text-2xl md:text-3xl font-extrabold text-white">Browse Our Shop</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Browse our catalogue of premium hill-grown fruits, add to your basket, and order with delivery right to your door.
            </p>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
              <span>Start shopping</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </div>
          </div>

          {/* Decorative emojis */}
          <motion.div
            className="absolute -bottom-2 -right-2 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 select-none"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            🍋
          </motion.div>
        </motion.button>
      </div>

      {/* Bottom tagline */}
      <motion.p
        className="relative z-10 text-slate-600 text-xs mt-10 md:mt-14 tracking-wider select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        © {new Date().getFullYear()} KhagraChori Agro — Khagrachari, Bangladesh
      </motion.p>
    </div>
  );
}
