import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OrchadCanvas from './components/scene/OrchadCanvas';
import HUD from './components/hud/HUD';
import CheckoutFlow from './components/checkout/CheckoutFlow';
import { useOrchardStore } from './store/useOrchardStore';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-linear-to-br from-[#0a1628] to-[#0d2a1a] z-100">
      <motion.div
        className="text-center flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-6xl animate-pulse select-none">🌿</div>
        <h1 className="text-3xl md:text-4xl font-black bg-linear-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent select-none tracking-wide">
          KhagraChori Agro
        </h1>
        <p className="text-slate-400 text-sm font-medium">Loading your orchard…</p>
        <div className="w-[240px] h-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-linear-to-r from-green-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const mode = useOrchardStore((s) => s.mode);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a1628] font-sans">
      <AnimatePresence mode="wait">
        {mode === 'explore' ? (
          <motion.div
            key="explore"
            className="relative w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 3D Canvas fills viewport with Loading Screen fallback */}
            <Suspense fallback={<LoadingScreen />}>
              <OrchadCanvas />
            </Suspense>
            
            {/* 2D HUD overlaid with pointer-events: none at root */}
            <div className="fixed inset-0 pointer-events-none z-20">
              <HUD />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
            className="w-full h-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CheckoutFlow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
