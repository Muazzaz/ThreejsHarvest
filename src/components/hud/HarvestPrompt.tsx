import { AnimatePresence, motion } from 'framer-motion';
import { PRODUCTS } from '../../lib/products';
import { useOrchardStore } from '../../store/useOrchardStore';

export default function HarvestPrompt() {
  const { nearbyFruit, harvestCooldown } = useOrchardStore();
  const product = nearbyFruit ? PRODUCTS[nearbyFruit] : null;

  return (
    <AnimatePresence>
      {nearbyFruit && product && (
        <motion.div
          key={nearbyFruit}
          initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.92 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 12, x: '-50%', scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-24 left-1/2 z-50 pointer-events-none flex flex-col items-center gap-1.5"
        >
          <div className="flex items-center gap-3 bg-[#0a1628]/75 border border-emerald-500/35 rounded-2xl p-3 px-5 backdrop-blur-md shadow-2xl white-space-nowrap">
            <span className="text-3xl select-none">{product.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-100">{product.name}</div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">৳{product.pricePerKg}/kg</div>
            </div>
            <div className={`text-[10px] font-black tracking-widest px-2.5 py-1.5 rounded-xl transition-all duration-300 border select-none ${harvestCooldown
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
              : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
              }`}>
              {harvestCooldown ? '✓ ADDED!' : 'SPACE'}
            </div>
          </div>
          {product.special && (
            <div className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest drop-shadow-md select-none bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
              ⭐ Khagrachari Special
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
