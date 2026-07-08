import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MedicineImage from '../components/MedicineImage';
import Card from '../components/Card';
import { 
  MdSearch, 
  MdShoppingCart, 
  MdFilterList, 
  MdClose,
  MdSort,
  MdClear
} from 'react-icons/md';
import { useProducts } from '../context/ProductsContext';

export default function Medicines() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products: productsData } = useProducts();

  // Fetch distinct categories and brands from data for dynamic filtering checklists
  const CATEGORIES_LIST = useMemo(() => Array.from(new Set(productsData.map(p => p.category))).sort(), [productsData]);
  const BRANDS_LIST = useMemo(() => Array.from(new Set(productsData.map(p => p.brand))).sort(), [productsData]);

  // Search parameters from URL
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";

  // Local states
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortBy, setSortBy] = useState("Popularity");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filters state
  const [selectedCategories, setSelectedCategories] = useState(
    urlCategory ? [urlCategory] : []
  );
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [rxOption, setRxOption] = useState("all"); // "all", "rx", "non-rx"
  const [stockOption, setStockOption] = useState("all"); // "all", "in-stock", "out-of-stock"

  // Synchronize input text with URL search parameters
  React.useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  // Synchronize category selection with URL category parameters
  React.useEffect(() => {
    if (urlCategory) {
      setSelectedCategories([urlCategory]);
    }
  }, [urlCategory]);

  // Filter and Sort logic
  const filteredProducts = useMemo(() => {
    let result = [...productsData];

    // Search query match (Matches name, brand, generic name, category)
    if (urlSearch.trim()) {
      const q = urlSearch.toLowerCase();
      result = result.filter(p => 
        p.medicine_name.toLowerCase().includes(q) ||
        p.generic_name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price filter (Max price)
    result = result.filter(p => p.price <= maxPrice);

    // Prescription required filter
    if (rxOption === "rx") {
      result = result.filter(p => p.prescription_required);
    } else if (rxOption === "non-rx") {
      result = result.filter(p => !p.prescription_required);
    }

    // Stock availability filter
    if (stockOption === "in-stock") {
      result = result.filter(p => p.stock > 0);
    } else if (stockOption === "out-of-stock") {
      result = result.filter(p => p.stock === 0);
    }

    // Sorting
    switch (sortBy) {
      case "Price Low to High":
        result.sort((a, b) => a.price - b.price);
        break;
      case "Price High to Low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "Best Selling":
        result.sort((a, b) => b.stock - a.stock); // higher stock indicates popularity variation
        break;
      case "Discount":
        result.sort((a, b) => b.discount_percentage - a.discount_percentage);
        break;
      case "New Arrivals":
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case "Popularity":
      default:
        result.sort((a, b) => a.id.localeCompare(b.id)); // original order
        break;
    }

    return result;
  }, [urlSearch, selectedCategories, selectedBrands, maxPrice, rxOption, stockOption, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchQuery.trim() });
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMaxPrice(500);
    setRxOption("all");
    setStockOption("all");
    setSortBy("Popularity");
    setSearchParams({});
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen pb-16 font-sans text-dark/90">
      
      {/* 🔍 TOP SEARCH AREA */}
      <section className="bg-white py-6 border-b border-dark/5 shadow-soft">
        <div className="container mx-auto px-4 max-w-4xl">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-background border border-dark/5 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
            <div className="pl-4 text-dark/45 shrink-0">
              <MdSearch className="text-xl" />
            </div>
            <input
              type="text"
              placeholder="Search medicine name, generic formula, brand or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-3 text-sm bg-transparent outline-none text-dark"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(""); setSearchParams({}); }}
                className="pr-2 text-dark/40 hover:text-dark"
              >
                <MdClear className="text-lg" />
              </button>
            )}
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase px-8 py-3.5"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 📦 CATALOG CONTAINER */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 🛡️ SIDEBAR FILTERS (DESKTOP) */}
          <aside className="hidden lg:block bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft space-y-6 h-fit sticky top-24 select-none">
            <div className="flex items-center justify-between border-b border-dark/5 pb-4">
              <h3 className="font-bold text-dark flex items-center gap-1.5">
                <MdFilterList className="text-primary text-xl" /> Filters
              </h3>
              <button 
                onClick={resetFilters}
                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Categories</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {CATEGORIES_LIST.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-xs text-dark/75 hover:text-primary cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="rounded text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Brands</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {BRANDS_LIST.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 text-xs text-dark/75 hover:text-primary cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="rounded text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Max Price</h4>
                <span className="text-xs font-bold text-primary">₹{maxPrice}</span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="500" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-background rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Prescription Filter */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Prescription</h4>
              <div className="space-y-1.5 text-xs text-dark/75">
                {["all", "rx", "non-rx"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer hover:text-primary">
                    <input 
                      type="radio" 
                      name="rxFilter"
                      checked={rxOption === opt}
                      onChange={() => setRxOption(opt)}
                      className="text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <span className="capitalize">{opt === "non-rx" ? "OTC Only" : opt === "rx" ? "Prescription Only" : "All Products"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Availability</h4>
              <div className="space-y-1.5 text-xs text-dark/75">
                {["all", "in-stock", "out-of-stock"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer hover:text-primary">
                    <input 
                      type="radio" 
                      name="stockFilter"
                      checked={stockOption === opt}
                      onChange={() => setStockOption(opt)}
                      className="text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <span className="capitalize">{opt === "in-stock" ? "In Stock Only" : opt === "out-of-stock" ? "Out of Stock" : "All"}</span>
                  </label>
                ))}
              </div>
            </div>

          </aside>

          {/* 🧪 PRODUCT LIST SECTION */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* Header controls bar */}
            <div className="bg-white border border-dark/5 px-6 py-4 rounded-[20px] shadow-soft flex items-center justify-between gap-4">
              <div className="text-left leading-none">
                <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">Catalog search</span>
                <h2 className="text-base sm:text-lg font-extrabold text-dark mt-1">
                  {urlSearch ? `Results for "${urlSearch}"` : urlCategory ? `Browse Category: ${urlCategory}` : "All Products"}
                </h2>
                <span className="text-xs text-dark/50 font-light mt-0.5 block">{filteredProducts.length} items found</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filters trigger button */}
                <button 
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-4 py-2 border border-dark/10 rounded-xl hover:bg-background text-xs font-bold text-dark/70"
                >
                  <MdFilterList className="text-base" /> Filters
                </button>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5">
                  <MdSort className="text-dark/45 text-lg" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-dark/10 bg-white text-xs font-bold text-dark/70 rounded-xl py-2 px-3 outline-none cursor-pointer hover:bg-background"
                  >
                    {["Popularity", "Price Low to High", "Price High to Low", "Best Selling", "Discount", "New Arrivals"].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative bg-white border border-dark/5 rounded-[22px] p-4 shadow-soft hover:shadow-hover flex flex-col justify-between"
                  >
                    {/* Prescription Required Tag */}
                    {product.prescription_required && (
                      <span className="absolute left-3 top-3 bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10">
                        Rx Required
                      </span>
                    )}

                    {/* Clickable Image & Details */}
                    <div 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="cursor-pointer flex flex-col"
                    >
                      <div className="w-full h-28 flex items-center justify-center mb-3 overflow-hidden rounded-xl bg-white border border-dark/5 p-1">
                        <MedicineImage product={product} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-dark text-xs sm:text-sm line-clamp-1 hover:text-primary transition-colors truncate">
                          {product.medicine_name}
                        </h4>
                        <p className="text-[10px] text-dark/45 font-medium mt-0.5">{product.brand}</p>
                        <p className="text-[9px] text-dark/55 mt-0.5">{product.pack_size}</p>
                      </div>
                    </div>

                    <div className="pt-2 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-extrabold text-dark">₹{product.price}</span>
                        {product.mrp > product.price && (
                          <>
                            <span className="text-[10px] text-dark/40 line-through">₹{product.mrp}</span>
                            <span className="bg-secondary/10 text-secondary-dark px-1 py-0.5 text-[8px] font-black rounded-md">
                              {product.discount_percentage}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className={`text-[9px] font-bold mt-1.5 ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </p>

                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={product.stock <= 0}
                        className={`w-full mt-2.5 py-2 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all select-none shadow-sm ${
                          product.stock > 0 
                            ? 'bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary cursor-pointer' 
                            : 'bg-dark/5 text-dark/30 border border-dark/5 cursor-not-allowed'
                        }`}
                      >
                        <MdShoppingCart className="text-xs" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card hoverable={false} className="py-16 text-center bg-white border border-dark/5 rounded-[24px]">
                <div className="text-4xl text-dark/30 mb-4">🔍</div>
                <h3 className="text-lg font-bold text-dark">No Products Found</h3>
                <p className="text-xs text-dark/50 mt-1 max-w-xs mx-auto">We couldn't find any products matching your active search filters. Try adjusting your checkboxes or min-max range.</p>
                <button 
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95"
                >
                  Reset All Filters
                </button>
              </Card>
            )}

          </main>

        </div>
      </div>

      {/* 📱 MOBILE FILTERS OVERLAY */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm flex justify-end">
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full max-w-xs bg-white h-full p-6 shadow-premium overflow-y-auto space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-dark/5 pb-4">
                <h3 className="font-bold text-dark flex items-center gap-1.5">
                  <MdFilterList className="text-primary text-xl" /> Filters
                </h3>
                <button 
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-dark/55 hover:text-red-500 rounded-full hover:bg-background p-1.5"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Categories</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {CATEGORIES_LIST.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-xs text-dark/75 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="rounded text-primary border-dark/15 w-4 h-4 cursor-pointer"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Brands</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {BRANDS_LIST.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 text-xs text-dark/75 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="rounded text-primary border-dark/15 w-4 h-4 cursor-pointer"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Max Price</h4>
                  <span className="text-xs font-bold text-primary">₹{maxPrice}</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="500" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-background rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Prescription Filter */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Prescription</h4>
                <div className="space-y-1.5 text-xs text-dark/75">
                  {["all", "rx", "non-rx"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="rxFilterMobile"
                        checked={rxOption === opt}
                        onChange={() => setRxOption(opt)}
                        className="text-primary border-dark/15 w-4 h-4 cursor-pointer"
                      />
                      <span className="capitalize">{opt === "non-rx" ? "OTC Only" : opt === "rx" ? "Prescription Only" : "All Products"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-dark uppercase tracking-wider">Availability</h4>
                <div className="space-y-1.5 text-xs text-dark/75">
                  {["all", "in-stock", "out-of-stock"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="stockFilterMobile"
                        checked={stockOption === opt}
                        onChange={() => setStockOption(opt)}
                        className="text-primary border-dark/15 w-4 h-4 cursor-pointer"
                      />
                      <span className="capitalize">{opt === "in-stock" ? "In Stock Only" : opt === "out-of-stock" ? "Out of Stock" : "All"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-6">
              <button 
                onClick={resetFilters}
                className="w-1/2 py-3 border border-dark/15 text-dark/60 text-xs font-bold uppercase rounded-xl hover:bg-background"
              >
                Reset
              </button>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="w-1/2 py-3 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase rounded-xl shadow-md"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
