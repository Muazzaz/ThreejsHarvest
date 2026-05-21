import { motion, AnimatePresence } from 'framer-motion';
import { useOrchardStore } from '../../store/useOrchardStore';
import { PRODUCTS } from '../../lib/products';

export default function HarvestPrompt() {
  const { nearbyFruit, harvestCooldown } = useOrchardStore();
  const product = nearbyFruit ? PRODUCTS[nearbyFruit] : null;

  return (
    <AnimatePresence>
      {nearbyFruit && product && (
        <motion.div
          key={nearbyFruit}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <div className="harvest-prompt">
            <span className="harvest-emoji">{product.emoji}</span>
            <div className="harvest-info">
              <div className="harvest-name">{product.name}</div>
              <div className="harvest-price">৳{product.pricePerKg}/kg</div>
            </div>
            <div className={`harvest-key ${harvestCooldown ? 'cooldown' : ''}`}>
              {harvestCooldown ? '✓ Added!' : 'SPACE'}
            </div>
          </div>
          {product.special && (
            <div className="guava-badge">⭐ Khagrachari Special</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
