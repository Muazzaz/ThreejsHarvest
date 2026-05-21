import { motion, AnimatePresence } from 'framer-motion';
import { useOrchardStore } from '../../store/useOrchardStore';

export default function CartPanel() {
  const { cartOpen, setCartOpen, cart, removeFromCart, totalPrice, setMode } =
    useOrchardStore();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            className="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="cart-header">
              <h2>🛒 Your Harvest</h2>
              <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <span>🌿</span>
                  <p>Drive near a fruit tree and press Space to harvest!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span className="cart-item-emoji">{item.emoji}</span>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-meta">
                        {item.weightKg} kg × ৳{item.pricePerKg}
                      </div>
                    </div>
                    <div className="cart-item-price">
                      ৳{(item.weightKg * item.pricePerKg).toLocaleString()}
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span>৳{totalPrice().toLocaleString()}</span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={() => {
                    setCartOpen(false);
                    setMode('checkout');
                  }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
