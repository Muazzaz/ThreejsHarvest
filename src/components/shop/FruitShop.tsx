import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { PRODUCTS } from '../../lib/products';
import { useOrchardStore } from '../../store/useOrchardStore';

const productList = Object.values(PRODUCTS);

type SortMode = 'default' | 'price-asc' | 'price-desc' | 'name';

/* ─── Navbar ────────────────────────────────────────────────────────────── */
function Navbar() {
  const { totalItems, setMode, cartOpen, setCartOpen } = useOrchardStore();
  const count = totalItems();

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#060e1a]/80 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Brand */}
        <button
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer group"
          onClick={() => setMode('landing')}
        >
          <span className="text-2xl select-none group-hover:rotate-12 transition-transform duration-300">🌿</span>
          <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
            KhagraChori Agro
          </span>
        </button>

        {/* Nav Links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'Products', 'About'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 no-underline"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400/40 rounded-xl px-4 py-2 text-emerald-400 text-xs font-bold cursor-pointer transition-all duration-200"
            onClick={() => setMode('explore')}
          >
            🌳 Visit Orchard
          </button>
          <button
            className="relative bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-300 hover:text-white text-sm font-semibold cursor-pointer transition-all duration-200"
            onClick={() => setCartOpen(!cartOpen)}
          >
            🛒
            {count > 0 && (
              <motion.span
                className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={count}
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero Section ──────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="home"
      className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060e1a] via-[#0a1a12] to-[#060e1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(16,185,129,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(245,158,11,0.08)_0%,transparent_50%)]" />
      </div>

      {/* Floating fruit decorations */}
      <motion.div
        className="absolute top-[15%] left-[10%] text-6xl md:text-8xl opacity-10 select-none"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        🥭
      </motion.div>
      <motion.div
        className="absolute top-[25%] right-[12%] text-5xl md:text-7xl opacity-10 select-none"
        animate={{ y: [0, -15, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        🍈
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] left-[18%] text-5xl md:text-7xl opacity-10 select-none"
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        🍋
      </motion.div>
      <motion.div
        className="absolute bottom-[30%] right-[8%] text-4xl md:text-6xl opacity-10 select-none"
        animate={{ y: [0, -18, 0], rotate: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        🧡
      </motion.div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
            <span className="text-sm select-none">🏔️</span>
            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
              Direct from Khagrachari Hills
            </span>
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <span className="text-white">Farm-Fresh Fruits</span>
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            from the Hills
          </span>
        </motion.h1>

        <motion.p
          className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Experience the taste of premium, organically grown fruits harvested from
          the lush hills of Khagrachari. Delivered fresh to your doorstep within
          24–48 hours.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <a
            href="#products"
            className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl px-8 py-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 text-base no-underline hover:-translate-y-0.5"
          >
            Shop Now →
          </a>
          <a
            href="#about"
            className="bg-white/5 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white font-bold rounded-2xl px-8 py-4 transition-all duration-300 text-base no-underline"
          >
            Our Story
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex justify-center gap-8 md:gap-14 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {[
            { value: '5+', label: 'Fruit Varieties' },
            { value: '100%', label: 'Organic' },
            { value: '24h', label: 'Fast Delivery' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white">
                {stat.value}
              </div>
              <div className="text-slate-500 text-xs font-medium mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Product Card ──────────────────────────────────────────────────────── */
function ProductCard({ product }: { product: (typeof productList)[0] }) {
  const { addToCart } = useOrchardStore();
  const [weight, setWeight] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product.id, weight);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      className="group relative bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 rounded-3xl overflow-hidden transition-all duration-500"
      whileHover={{ y: -6, scale: 1.02 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />

      {/* Product "image" area */}
      <div
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.canopyColor}15, ${product.fruitColor}10)`,
        }}
      >
        <motion.span
          className="text-7xl md:text-8xl select-none filter drop-shadow-lg"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {product.emoji}
        </motion.span>

        {product.special && (
          <div className="absolute top-4 left-4 bg-amber-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
            ⭐ Special
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-white">{product.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{product.nameBn}</p>
          </div>
          <div className="text-right">
            <div className="text-emerald-400 font-extrabold text-lg">
              ৳{product.pricePerKg}
            </div>
            <div className="text-slate-500 text-[10px] font-medium">per kg</div>
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-5 line-clamp-2">
          {product.description}
        </p>

        {/* Weight + Add to Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none text-sm font-bold"
              onClick={() => setWeight(Math.max(0.5, weight - 0.5))}
            >
              −
            </button>
            <span className="px-3 py-2 text-sm text-white font-semibold min-w-[60px] text-center">
              {weight} kg
            </span>
            <button
              className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none text-sm font-bold"
              onClick={() => setWeight(weight + 0.5)}
            >
              +
            </button>
          </div>

          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold cursor-pointer transition-all duration-300 border-none ${
              added
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-md shadow-emerald-500/15 hover:shadow-emerald-500/30'
            }`}
            onClick={handleAdd}
          >
            {added ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Products Section ──────────────────────────────────────────────────── */
function ProductsSection() {
  const [sort, setSort] = useState<SortMode>('default');

  const sorted = [...productList].sort((a, b) => {
    if (sort === 'price-asc') return a.pricePerKg - b.pricePerKg;
    if (sort === 'price-desc') return b.pricePerKg - a.pricePerKg;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <section id="products" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
            Our Collection
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-3 mb-4">
            Premium Hill-Grown Fruits
          </h2>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            Each fruit is carefully selected and harvested at peak ripeness from
            our orchards in Khagrachari.
          </p>
        </motion.div>

        {/* Sort bar */}
        <div className="flex justify-end mb-8">
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-sm outline-none cursor-pointer hover:border-white/20 transition-colors"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option className="bg-[#0f1f35]" value="default">
              Default
            </option>
            <option className="bg-[#0f1f35]" value="price-asc">
              Price: Low → High
            </option>
            <option className="bg-[#0f1f35]" value="price-desc">
              Price: High → Low
            </option>
            <option className="bg-[#0f1f35]" value="name">
              Name: A → Z
            </option>
          </select>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ──────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: '🌱',
      title: '100% Organic',
      desc: 'No pesticides or chemicals. Pure, natural hill farming.',
      color: 'emerald',
    },
    {
      icon: '🚚',
      title: 'Free Delivery',
      desc: 'Free shipping on all orders across Bangladesh.',
      color: 'blue',
    },
    {
      icon: '🏔️',
      title: 'Hill-Grown',
      desc: 'Unique flavour from the terraced farms of Khagrachari.',
      color: 'amber',
    },
    {
      icon: '⏰',
      title: '24-48hr Delivery',
      desc: 'Harvested and shipped within hours of your order.',
      color: 'rose',
    },
  ];

  return (
    <section className="relative py-24 px-6">
      {/* Subtle divider gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(16,185,129,0.04)_0%,transparent_60%)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
            Farm to Table, Naturally
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/15 rounded-2xl p-7 text-center transition-all duration-500"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 select-none">
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About Section ─────────────────────────────────────────────────────── */
function AboutSection() {
  return (
    <section id="about" className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left — Story */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
              Our Story
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-6">
              From Khagrachari
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                With Love
              </span>
            </h2>
            <div className="flex flex-col gap-4 text-slate-400 text-sm leading-relaxed">
              <p>
                Nestled in the lush Chittagong Hill Tracts, Khagrachari is home to
                some of the most fertile farmland in Bangladesh. Our orchards sit at
                the perfect altitude where cool breezes meet tropical warmth.
              </p>
              <p>
                We partner with local hill farmers to bring you the freshest,
                pesticide-free fruits. Every fruit is handpicked at peak ripeness to
                ensure you get nothing but the best from the hills.
              </p>
              <p>
                By choosing KhagraChori Agro, you directly support the livelihoods
                of indigenous farming communities in the Chittagong Hill Tracts.
              </p>
            </div>
          </motion.div>

          {/* Right — Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/10 rounded-3xl p-10 md:p-14 overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.1),transparent_60%)]" />

              <div className="relative z-10 grid grid-cols-3 gap-4">
                {['🥭', '🍈', '🍋', '🧡', '🍒', '🌿'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="aspect-square bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-3xl md:text-4xl select-none"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      y: { duration: 3, repeat: Infinity, delay: i * 0.3 },
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Cart Sidebar ──────────────────────────────────────────────────────── */
function CartSidebar() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateWeight,
    totalPrice,
    totalWeight,
    setMode,
    setCheckoutStep,
  } = useOrchardStore();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a1222]/95 backdrop-blur-2xl border-l border-white/[0.06] z-50 flex flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <h3 className="text-lg font-extrabold text-white">
                Your Cart 🛒
              </h3>
              <button
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-all"
                onClick={() => setCartOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <span className="text-5xl opacity-30">🛒</span>
                  <p className="text-slate-500 text-sm">
                    Your cart is empty. Start adding some delicious fruits!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4"
                    >
                      <span className="text-3xl select-none">{item.emoji}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ৳{item.pricePerKg}/kg
                        </div>
                        {/* Weight controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                            onClick={() =>
                              updateWeight(
                                item.id,
                                Math.max(0.5, item.weightKg - 0.5),
                              )
                            }
                          >
                            −
                          </button>
                          <span className="text-xs text-white font-semibold min-w-[40px] text-center">
                            {item.weightKg} kg
                          </span>
                          <button
                            className="w-6 h-6 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                            onClick={() =>
                              updateWeight(item.id, item.weightKg + 0.5)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold text-sm">
                          ৳{(item.weightKg * item.pricePerKg).toLocaleString()}
                        </div>
                        <button
                          className="text-slate-500 hover:text-rose-400 text-xs mt-1 bg-transparent border-none cursor-pointer transition-colors"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Total Weight</span>
                    <span>{totalWeight().toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Delivery</span>
                    <span className="text-emerald-400 font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>৳{totalPrice().toLocaleString()}</span>
                  </div>
                </div>
                <button
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-2xl py-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 cursor-pointer active:scale-[0.98] border-none text-base"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutStep('cart');
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

/* ─── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#040a14]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-2xl select-none">🌿</span>
              <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                KhagraChori Agro
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Premium, organically grown fruits from the hills of Khagrachari,
              Bangladesh. Supporting local hill farmers since day one.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2.5">
              {['Home', 'Products', 'About'].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  className="text-slate-500 hover:text-emerald-400 text-sm transition-colors no-underline"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Contact
            </h4>
            <div className="flex flex-col gap-2.5 text-slate-500 text-sm">
              <span>📞 +880 1700-000000</span>
              <span>📧 hello@khagrachoriagro.com</span>
              <span>📍 Khagrachari, Bangladesh</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} KhagraChori Agro. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Facebook', 'Instagram', 'WhatsApp'].map((s) => (
              <span
                key={s}
                className="text-slate-600 hover:text-emerald-400 text-xs cursor-pointer transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main FruitShop ────────────────────────────────────────────────────── */
export default function FruitShop() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="w-full h-full overflow-y-auto bg-[#060e1a] font-[Outfit,system-ui,sans-serif] text-slate-100 scroll-smooth"
    >
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <FeaturesSection />
      <AboutSection />
      <Footer />
      <CartSidebar />
    </div>
  );
}
