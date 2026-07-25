import { useEffect, useState } from 'react';
import { getTimeConfig } from '../../lib/timeOfDay';
import { useOrchardStore } from '../../store/useOrchardStore';
import CartPanel from './CartPanel';
import HarvestPrompt from './HarvestPrompt';

export default function HUD() {
  const { totalItems, totalWeight, totalPrice, setCartOpen, cartOpen, setMode, timeMode, setTimeMode } =
    useOrchardStore();
  const count = totalItems();
  const weight = totalWeight();
  const [timeConfig, setTimeConfig] = useState(() => getTimeConfig(timeMode));
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  useEffect(() => {
    const update = () => setTimeConfig(getTimeConfig(timeMode));
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [timeMode]);

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

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-2.5">
          {/* Time of Day Indicator & Menu */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 bg-[#0f1f35]/70 border border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/15 rounded-full px-3 py-2 text-slate-200 text-xs font-semibold cursor-pointer backdrop-blur-md transition-all duration-200 select-none shadow-md"
              onClick={() => setShowTimeMenu(!showTimeMenu)}
              title="Click to change orchard time mode"
            >
              <span>{timeConfig.badgeIcon}</span>
              <span className="hidden sm:inline font-medium text-slate-200">
                {timeConfig.badgeName}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-black/40 rounded px-1.5 py-0.5">
                {timeConfig.formattedTime}
              </span>
            </button>

            {showTimeMenu && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-[#0b1728]/95 border border-emerald-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1">
                <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Orchard Atmosphere
                </div>
                {(
                  [
                    { id: 'auto', label: 'Local System Sync', icon: '⏰', desc: 'Syncs live with your clock' },
                    { id: 'day', label: 'Daytime', icon: '☀️', desc: 'Bright sunny hills' },
                    { id: 'sunset', label: 'Golden Sunset', icon: '🌅', desc: 'Warm dusk lights' },
                    { id: 'night', label: 'Night Orchard', icon: '🌙', desc: 'Moonlight, stars & headlights' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      timeMode === opt.id
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => {
                      setTimeMode(opt.id);
                      setShowTimeMenu(false);
                    }}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-[9px] text-slate-400 font-normal">{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Home button */}
          <button
            className="flex items-center gap-1.5 bg-[#0f1f35]/50 border border-white/15 hover:border-white/30 hover:bg-white/10 rounded-full px-3 py-2 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer backdrop-blur-md transition-all duration-200 select-none shadow-md"
            onClick={() => setMode('landing')}
          >
            🏠 <span className="hidden sm:inline">Home</span>
          </button>

          {/* Visit Shop button */}
          <button
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 hover:bg-amber-500/15 rounded-full px-3 py-2 text-amber-400 text-xs font-semibold cursor-pointer backdrop-blur-md transition-all duration-200 select-none shadow-md"
            onClick={() => setMode('shop')}
          >
            🛍️ <span className="hidden sm:inline">Visit Shop</span>
          </button>

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
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <kbd className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-200 select-none shadow-sm">CTRL + Mouse</kbd>
          <span>Orbit Camera</span>
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
