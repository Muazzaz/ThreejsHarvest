import { useOrchardStore } from '../../store/useOrchardStore';
import HarvestPrompt from './HarvestPrompt';
import CartPanel from './CartPanel';

export default function HUD() {
  const { totalItems, totalWeight, totalPrice, setCartOpen, cartOpen, setMode } =
    useOrchardStore();
  const count = totalItems();
  const weight = totalWeight();

  return (
    <>
      {/* Top bar */}
      <div className="hud-top">
        {/* Logo */}
        <div className="hud-logo">
          <span className="hud-logo-icon">🌿</span>
          <div>
            <div className="hud-logo-name">KhagraChori Agro</div>
            <div className="hud-logo-sub">Khagrachari Hills Orchard</div>
          </div>
        </div>

        {/* Cart button */}
        <button className="hud-cart-btn" onClick={() => setCartOpen(!cartOpen)}>
          🛒
          {count > 0 && <span className="hud-cart-badge">{count}</span>}
          <span className="hud-cart-label">
            {count > 0 ? `${weight.toFixed(1)} kg` : 'Cart'}
          </span>
        </button>
      </div>

      {/* Controls legend */}
      <div className="hud-controls">
        <div className="hud-control-row">
          <kbd>W A S D</kbd> <span>Drive</span>
        </div>
        <div className="hud-control-row">
          <kbd>SPACE</kbd> <span>Harvest</span>
        </div>
      </div>

      {/* Zone label — bottom left */}
      <div className="hud-zone-label">
        📍 Khagrachari Hills · 25 Acres
      </div>

      {/* Harvest toast (center bottom) */}
      <HarvestPrompt />

      {/* Cart drawer */}
      <CartPanel />

      {/* Checkout shortcut when cart not empty */}
      {count > 0 && (
        <button
          className="hud-checkout-fab"
          onClick={() => setMode('checkout')}
          title="Go to Checkout"
        >
          Checkout →
          <span className="hud-checkout-price">
          ৳{totalPrice().toLocaleString()}
          </span>
        </button>
      )}
    </>
  );
}
