import { AnimatePresence, motion } from 'framer-motion';
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-39 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-[#0f1f35] border-l border-emerald-500/15 flex flex-col z-40 shadow-2xl pointer-events-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="flex justify-between items-center py-5 px-6 border-b border-white/10">
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2 select-none">
                <span>🛒</span> Your Harvest
              </h2>
              <button
                className="bg-transparent border-none text-slate-400 hover:text-white hover:bg-white/8 text-sm cursor-pointer transition-all duration-200"
                style={{ padding: '6px 12px', borderRadius: '8px' }}
                onClick={() => setCartOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-6 flex flex-col gap-3">
              {cart.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-3 text-center select-none"
                  style={{ padding: '64px 20px' }}
                >
                  <span className="text-5xl animate-pulse">🌿</span>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
                    Your basket is empty! Drive near a fruit tree and hold <strong className="text-emerald-400">SPACE</strong> to harvest delicious hill fruits.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl hover:border-emerald-500/10 transition-all duration-200 shadow-sm"
                    style={{ padding: '12px 14px' }}
                  >
                    <span className="text-2xl select-none">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.weightKg} kg × ৳{item.pricePerKg}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-400">
                      ৳{(item.weightKg * item.pricePerKg).toLocaleString()}
                    </div>
                    <button
                      className="bg-transparent border-none text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 cursor-pointer"
                      style={{ padding: '6px 10px' }}
                      onClick={() => removeFromCart(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="py-5 px-6 border-t border-white/10 flex flex-col gap-3.5 bg-slate-950/20">
                <div className="flex justify-between items-center text-sm font-bold text-slate-200">
                  <span>Basket Subtotal</span>
                  <span className="text-emerald-400 text-base">৳{totalPrice().toLocaleString()}</span>
                </div>
                <button
                  className="w-full bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold rounded-xl py-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer active:scale-[0.98]"
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
