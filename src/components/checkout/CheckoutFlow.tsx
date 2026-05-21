import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useOrchardStore } from '../../store/useOrchardStore';

// ─── Cart Review Step ───────────────────────────────────────────────────────
function CartReview() {
  const { cart, removeFromCart, totalPrice, totalWeight, setCheckoutStep } =
    useOrchardStore();

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-hidden">
      <h2 className="text-2xl font-extrabold text-white mb-2">Your Harvest Basket 🧺</h2>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-5xl">🛒</span>
          <p className="text-slate-400 text-sm">Your basket is empty. Head back to the orchard to harvest fresh fruits!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-4 transition-all duration-200 shadow-md">
              <span className="text-3xl select-none">{item.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-100">{item.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.weightKg} kg × ৳{item.pricePerKg}/kg</div>
              </div>
              <div className="text-base font-bold text-emerald-400">৳{(item.weightKg * item.pricePerKg).toLocaleString()}</div>
              <button
                className="bg-transparent text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-all duration-200 cursor-pointer"
                onClick={() => removeFromCart(item.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col gap-3 mt-1 shadow-inner">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Total Weight</span>
              <span>{totalWeight().toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Delivery</span>
              <span className="text-emerald-400 font-semibold">FREE</span>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between text-lg font-bold text-slate-100">
              <span>Grand Total</span>
              <span>৳{totalPrice().toLocaleString()}</span>
            </div>
          </div>

          <button
            className="w-full bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl p-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={cart.length === 0}
            onClick={() => setCheckoutStep('shipping')}
          >
            Continue to Shipping →
          </button>
        </>
      )}
    </div>
  );
}

// ─── Shipping Step ──────────────────────────────────────────────────────────
function ShippingForm() {
  const { orderDetails, setOrderDetails, setCheckoutStep } = useOrchardStore();
  const [err, setErr] = useState('');

  const handleNext = () => {
    if (!orderDetails.name || !orderDetails.phone || !orderDetails.address || !orderDetails.district) {
      setErr('Please fill in all fields.');
      return;
    }
    setErr('');
    setCheckoutStep('payment');
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold text-white mb-2">Delivery Details 📦</h2>

      {err && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs font-medium">
          ⚠️ {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Full Name</label>
          <input
            type="text"
            className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 shadow-inner"
            placeholder="Your full name"
            value={orderDetails.name}
            onChange={(e) => setOrderDetails({ name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Phone Number</label>
          <input
            type="tel"
            className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 shadow-inner"
            placeholder="01XXXXXXXXX"
            value={orderDetails.phone}
            onChange={(e) => setOrderDetails({ phone: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Delivery Address</label>
          <textarea
            rows={3}
            className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 resize-none shadow-inner"
            placeholder="House #, Road #, Area details"
            value={orderDetails.address}
            onChange={(e) => setOrderDetails({ address: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">District</label>
          <select
            className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 shadow-inner cursor-pointer"
            value={orderDetails.district}
            onChange={(e) => setOrderDetails({ district: e.target.value })}
          >
            <option className="bg-[#0f1f35]" value="">Select district</option>
            {['Khagrachari', 'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Rangpur', 'Mymensingh', 'Barishal'].map(d => (
              <option className="bg-[#0f1f35]" key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 text-slate-300 hover:text-white text-base font-bold transition-all duration-200 cursor-pointer"
          onClick={() => setCheckoutStep('cart')}
        >
          ← Back
        </button>
        <button
          className="flex-2 bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl p-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          onClick={handleNext}
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}

// ─── Payment Step ───────────────────────────────────────────────────────────
function PaymentForm() {
  const { totalPrice, cart, orderDetails, setCheckoutStep, setOrderId } =
    useOrchardStore();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'cod' | 'bkash' | 'card'>('cod');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: orderDetails,
          items: cart.map((i) => ({ productId: i.id, weightKg: i.weightKg, unitPrice: i.pricePerKg })),
          totalAmount: totalPrice(),
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      setOrderId(data.orderId || `ORD-${Date.now()}`);
    } catch {
      // Offline fallback
      setOrderId(`ORD-${Date.now()}`);
    }
    setCheckoutStep('success');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold text-white mb-2">Payment 💳</h2>

      <div className="flex flex-col gap-3">
        {[
          { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
          { id: 'bkash', label: 'bKash', icon: '📱' },
          { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
        ].map((m) => (
          <button
            key={m.id}
            className={`flex items-center gap-4 bg-white/4 border-2 rounded-2xl p-4 text-slate-100 text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md ${method === m.id
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/5 hover:border-emerald-500/20'
              }`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setMethod(m.id as any)}
          >
            <span className="text-2xl select-none">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {method === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Card Number</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 shadow-inner"
              placeholder="•••• •••• •••• ••••"
              maxLength={19}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Expiry</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 shadow-inner"
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">CVV</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-emerald-500/5 focus:ring-3 focus:ring-emerald-500/15 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all duration-200 shadow-inner"
              placeholder="•••"
              maxLength={3}
            />
          </div>
        </div>
      )}

      {method === 'bkash' && (
        <div className="bg-pink-500/8 border border-pink-500/25 rounded-2xl p-4 mt-1 text-sm text-pink-200/90 shadow-md">
          <p className="font-semibold">Send payment to: <strong className="text-pink-300 font-bold ml-1 text-base">01700000000</strong></p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">After sending, please share the TrxID or phone number. Our support team will confirm your order manually.</p>
        </div>
      )}

      <div className="bg-linear-to-r from-green-950/70 to-emerald-950/70 border border-emerald-700/40 rounded-2xl p-4 text-center mt-2 font-black text-xl text-emerald-400 shadow-md select-none">
        Total Order Value: ৳{totalPrice().toLocaleString()}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 text-slate-300 hover:text-white text-base font-bold transition-all duration-200 cursor-pointer"
          onClick={() => setCheckoutStep('shipping')}
        >
          ← Back
        </button>
        <button
          className="flex-2 bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl p-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Placing Order…' : 'Place Order ✓'}
        </button>
      </div>
    </div>
  );
}

// ─── Success Step ───────────────────────────────────────────────────────────
function SuccessScreen() {
  const { orderId, clearCart, setMode, setCheckoutStep } = useOrchardStore();

  const handleBack = () => {
    clearCart();
    setCheckoutStep('cart');
    setMode('explore');
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col items-center text-center gap-6 py-8 px-4">
      <div className="text-7xl animate-bounce">🎉</div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold text-white">Order Confirmed!</h2>
        <p className="text-emerald-400 text-base font-medium">Your fresh Khagrachari harvest is on its way.</p>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-3 text-sm font-semibold text-emerald-400 shadow-md">
        Order ID: {orderId}
      </div>

      <p className="text-slate-400 text-sm leading-relaxed max-w-[390px]">
        Our team will contact you shortly to confirm delivery details.
        Expect fresh hill fruits within <strong>24–48 hours</strong>.
      </p>

      <button
        className="w-full max-w-[340px] bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl p-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer active:scale-[0.98]"
        onClick={handleBack}
      >
        🌿 Explore Orchard Again
      </button>
    </div>
  );
}

// ─── Main CheckoutFlow ──────────────────────────────────────────────────────
const STEPS = ['cart', 'shipping', 'payment', 'success'] as const;

export default function CheckoutFlow() {
  const { checkoutStep, setMode } = useOrchardStore();

  return (
    <div className="w-full min-h-full bg-linear-to-br from-[#0a1628] to-[#0d2a1a] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-[#0a1628]/70 backdrop-blur-md sticky top-0 z-10">
        <button
          className="bg-transparent border border-white/15 hover:border-white/30 rounded-xl px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-all duration-200"
          onClick={() => setMode('explore')}
        >
          ← Back to Orchard
        </button>
        <div className="text-base font-bold text-emerald-400 flex items-center gap-2 select-none">
          <span>🌿</span> KhagraChori Agro
        </div>
        <div className="w-[110px] hidden md:block" />
      </div>

      {/* Progress bar */}
      {checkoutStep !== 'success' && (
        <div className="flex justify-center items-center gap-0 py-8 px-6">
          {(['cart', 'shipping', 'payment'] as const).map((s, i) => {
            const isDone = STEPS.indexOf(checkoutStep) >= i;
            return (
              <div
                key={s}
                className={`flex items-center gap-2 transition-all duration-300 ${isDone ? 'text-emerald-400' : 'text-slate-600'
                  }`}
              >
                {i > 0 && <div className="w-8 md:w-16 h-[2px] bg-white/10 mx-2 md:mx-4" />}
                <div className={`w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold bg-transparent transition-all duration-300 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : ''
                  }`}>
                  {i + 1}
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase hidden sm:inline">
                  {s === 'cart' ? 'Basket' : s === 'shipping' ? 'Delivery' : 'Payment'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex justify-center py-6 px-4 md:px-8 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={checkoutStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            {checkoutStep === 'cart' && <CartReview />}
            {checkoutStep === 'shipping' && <ShippingForm />}
            {checkoutStep === 'payment' && <PaymentForm />}
            {checkoutStep === 'success' && <SuccessScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
