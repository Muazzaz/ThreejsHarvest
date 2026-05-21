import { useOrchardStore } from '../../store/useOrchardStore';
import CartPanel from './CartPanel';
import HarvestPrompt from './HarvestPrompt';

export default function HUD() {
  const { totalItems, totalWeight, totalPrice, setCartOpen, cartOpen, setMode } =
    useOrchardStore();
  const count = totalItems();
  const weight = totalWeight();

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center p-4 md:px-8 bg-linear-to-b from-[#0a1628]/80 to-transparent backdrop-blur-xs pointer-events-auto z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 pointer-events-none">
          <span className="text-3xl select-none">🌿</span>
          <div>
            <div className="text-sm md:text-base font-bold text-emerald-400 tracking-wide leading-tight">KhagraChori Agro</div>
            <div className="text-[10px] md:text-xs text-slate-400 mt-0.5 leading-none">Khagrachari Hills Orchard</div>
          </div>
        </div>

        {/* Cart button */}
        <button
          className="flex items-center gap-2.5 bg-[#0f1f35]/50 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-400 rounded-full px-4 py-2 text-slate-100 text-sm font-sans cursor-pointer backdrop-blur-md transition-all duration-200 relative select-none shadow-md"
          onClick={() => setCartOpen(!cartOpen)}
        >
          <span className="text-lg">🛒</span>
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
              {count}
            </span>
          )}
          <span className="font-bold tracking-wide">
            {count > 0 ? `${weight.toFixed(1)} kg` : 'Cart'}
          </span>
        </button>
      </div>

      {/* Controls legend */}
      <div className="fixed bottom-5 left-5 flex flex-col gap-1.5 pointer-events-none z-10">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <kbd className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-200 select-none shadow-sm">W A S D</kbd>
          <span>Drive Buggy</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <kbd className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-200 select-none shadow-sm">SPACE</kbd>
          <span>Harvest Fruit</span>
        </div>
      </div>

      {/* Zone label — bottom right */}
      <div className="fixed bottom-5 right-5 text-[11px] text-slate-500 font-semibold select-none pointer-events-none z-10 tracking-wider uppercase">
        📍 Khagrachari Hills · 25 Acres
      </div>

      {/* Harvest toast (center bottom) */}
      <HarvestPrompt />

      {/* Cart drawer */}
      <CartPanel />

      {/* Checkout shortcut when cart not empty */}
      {count > 0 && (
        <button
          className="fixed bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 border border-emerald-400 hover:border-emerald-300 rounded-2xl px-6 py-2.5 text-white text-sm font-extrabold cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 pointer-events-auto active:scale-[0.98] z-30"
          onClick={() => setMode('checkout')}
          title="Go to Checkout"
        >
          Checkout →
          <span className="text-[10px] opacity-85 font-medium mt-0.5">
            Total Value: ৳{totalPrice().toLocaleString()}
          </span>
        </button>
      )}
    </>
  );
}
