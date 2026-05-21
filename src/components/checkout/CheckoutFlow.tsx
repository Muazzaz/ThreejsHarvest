import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrchardStore } from '../../store/useOrchardStore';

// ─── Cart Review Step ───────────────────────────────────────────────────────
function CartReview() {
  const { cart, removeFromCart, totalPrice, totalWeight, setCheckoutStep } =
    useOrchardStore();

  return (
    <div className="checkout-step">
      <h2 className="step-title">Your Harvest Basket 🧺</h2>

      {cart.map((item) => (
        <div key={item.id} className="checkout-item">
          <span className="ci-emoji">{item.emoji}</span>
          <div className="ci-info">
            <div className="ci-name">{item.name}</div>
            <div className="ci-detail">{item.weightKg} kg × ৳{item.pricePerKg}/kg</div>
          </div>
          <div className="ci-price">৳{(item.weightKg * item.pricePerKg).toLocaleString()}</div>
          <button className="ci-remove" onClick={() => removeFromCart(item.id)}>✕</button>
        </div>
      ))}

      <div className="checkout-summary">
        <div className="summary-row">
          <span>Total Weight</span>
          <span>{totalWeight().toFixed(1)} kg</span>
        </div>
        <div className="summary-row">
          <span>Delivery</span>
          <span className="free-tag">FREE</span>
        </div>
        <div className="summary-row total-row">
          <span>Grand Total</span>
          <span>৳{totalPrice().toLocaleString()}</span>
        </div>
      </div>

      <button
        className="step-btn"
        disabled={cart.length === 0}
        onClick={() => setCheckoutStep('shipping')}
      >
        Continue to Shipping →
      </button>
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
    setCheckoutStep('payment');
  };

  return (
    <div className="checkout-step">
      <h2 className="step-title">Delivery Details 📦</h2>
      {err && <div className="form-error">{err}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={orderDetails.name}
            onChange={(e) => setOrderDetails({ name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={orderDetails.phone}
            onChange={(e) => setOrderDetails({ phone: e.target.value })}
          />
        </div>
        <div className="form-group full-width">
          <label>Delivery Address</label>
          <textarea
            rows={3}
            placeholder="House/Road/Area"
            value={orderDetails.address}
            onChange={(e) => setOrderDetails({ address: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>District</label>
          <select
            value={orderDetails.district}
            onChange={(e) => setOrderDetails({ district: e.target.value })}
          >
            <option value="">Select district</option>
            {['Khagrachari', 'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Rangpur', 'Mymensingh', 'Barishal'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="step-nav">
        <button className="step-btn-ghost" onClick={() => setCheckoutStep('cart')}>← Back</button>
        <button className="step-btn" onClick={handleNext}>Continue to Payment →</button>
      </div>
    </div>
  );
}

// ─── Payment Step ───────────────────────────────────────────────────────────
function PaymentForm() {
  const { totalPrice, cart, orderDetails, setCheckoutStep, setOrderId, setMode, clearCart } =
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
    <div className="checkout-step">
      <h2 className="step-title">Payment 💳</h2>

      <div className="payment-methods">
        {[
          { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
          { id: 'bkash', label: 'bKash', icon: '📱' },
          { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
        ].map((m) => (
          <button
            key={m.id}
            className={`payment-method ${method === m.id ? 'active' : ''}`}
            onClick={() => setMethod(m.id as any)}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {method === 'card' && (
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Card Number</label>
            <input type="text" placeholder="•••• •••• •••• ••••" maxLength={19} />
          </div>
          <div className="form-group">
            <label>Expiry</label>
            <input type="text" placeholder="MM/YY" maxLength={5} />
          </div>
          <div className="form-group">
            <label>CVV</label>
            <input type="text" placeholder="•••" maxLength={3} />
          </div>
        </div>
      )}

      {method === 'bkash' && (
        <div className="bkash-info">
          <p>Send payment to: <strong>01XXXXXXXXX</strong></p>
          <p className="bkash-note">After payment, our team will confirm your order.</p>
        </div>
      )}

      <div className="order-total-banner">
        Total: ৳{totalPrice().toLocaleString()}
      </div>

      <div className="step-nav">
        <button className="step-btn-ghost" onClick={() => setCheckoutStep('shipping')}>← Back</button>
        <button className="step-btn" onClick={handleSubmit} disabled={loading}>
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
    <div className="checkout-step success-step">
      <div className="success-icon">🎉</div>
      <h2>Order Confirmed!</h2>
      <p className="success-sub">Your fresh Khagrachari harvest is on its way.</p>
      <div className="order-id-badge">Order ID: {orderId}</div>
      <p className="success-msg">
        Our team will contact you shortly to confirm delivery details. 
        Expect fresh fruits within <strong>24–48 hours</strong>.
      </p>
      <button className="step-btn" onClick={handleBack}>
        🌿 Explore Orchard Again
      </button>
    </div>
  );
}

// ─── Main CheckoutFlow ──────────────────────────────────────────────────────
const STEPS = ['cart', 'shipping', 'payment', 'success'] as const;

export default function CheckoutFlow() {
  const { checkoutStep, setMode, setCheckoutStep } = useOrchardStore();

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <button className="back-to-farm" onClick={() => setMode('explore')}>
          ← Back to Orchard
        </button>
        <div className="checkout-logo">
          <span>🌿</span> KhagraChori Agro
        </div>
        <div />
      </div>

      {/* Progress bar */}
      {checkoutStep !== 'success' && (
        <div className="checkout-progress">
          {(['cart', 'shipping', 'payment'] as const).map((s, i) => (
            <div
              key={s}
              className={`progress-step ${
                STEPS.indexOf(checkoutStep) >= i ? 'done' : ''
              }`}
            >
              <div className="progress-dot">{i + 1}</div>
              <span>{s === 'cart' ? 'Basket' : s === 'shipping' ? 'Delivery' : 'Payment'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="checkout-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={checkoutStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
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
