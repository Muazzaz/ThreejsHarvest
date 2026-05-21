import { AnimatePresence, motion } from 'framer-motion';
import OrchadCanvas from './components/scene/OrchadCanvas';
import HUD from './components/hud/HUD';
import CheckoutFlow from './components/checkout/CheckoutFlow';
import { useOrchardStore } from './store/useOrchardStore';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <motion.div
        className="loading-inner"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="loading-icon">🌿</div>
        <h1>KhagraChori Agro</h1>
        <p>Loading your orchard…</p>
        <div className="loading-bar">
          <motion.div
            className="loading-fill"
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
    <div className="app-root">
      <AnimatePresence mode="wait">
        {mode === 'explore' ? (
          <motion.div
            key="explore"
            className="explore-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 3D Canvas fills viewport */}
            <OrchadCanvas />
            {/* 2D HUD overlaid with pointer-events: none at root */}
            <div className="hud-overlay">
              <HUD />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
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
