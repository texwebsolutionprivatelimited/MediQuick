import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MedicineImage from '../components/MedicineImage';
import Card from '../components/Card';
import LoadingSkeleton from '../components/LoadingSkeleton';
import QuantityStepper from '../components/QuantityStepper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdShoppingCart, 
  MdFilterList, 
  MdClose,
  MdSort,
  MdFavorite,
  MdFavoriteBorder,
  MdCheckCircle
} from 'react-icons/md';
import { useProducts } from '../context/ProductsContext';
import { useWishlist } from '../context/WishlistContext';

function Highlight({ text, search }) {
  if (!search || !search.trim()) return <span>{text}</span>;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) 
          ? <mark key={i} className="bg-yellow-100 text-dark font-medium rounded-sm px-0.5">{part}</mark> 
          : part
      )}
    </span>
  );
}

const QUERY_TO_CATEGORY_MAP = {
  "prescription": "Medicines",
  "healthcare": "OTC Medicines",
  "personalcare": "Personal Care",
  "babycare": "Baby Care",
  "diabetes": "Diabetes Care",
  "heart": "Heart Care",
  "ayurvedic": "Ayurveda",
  "labtests": "Lab Tests",
  "devices": "Medical Devices",
  "supplements": "Vitamins",
  "medicines": "Medicines",
  "otc medicines": "OTC Medicines",
  "personal care": "Personal Care",
  "baby care": "Baby Care",
  "diabetes care": "Diabetes Care",
  "heart care": "Heart Care",
  "ayurveda": "Ayurveda",
  "lab tests": "Lab Tests",
  "medical devices": "Medical Devices",
  "vitamins": "Vitamins"
};

export default function Medicines() {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products: productsData, categories, loading } = useProducts();

  // Fetch distinct categories and brands from data for dynamic filtering checklists
  const CATEGORIES_LIST = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.filter(c => c.status !== 'inactive').map(c => c.name).sort();
    }
    return Array.from(new Set(productsData.map(p => p.category))).sort();
  }, [productsData, categories]);

  // Search parameters from URL
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";

  // Local states
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortBy, setSortBy] = useState("Popularity");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  // Filters state
  const [selectedCategories, setSelectedCategories] = useState(() => {
    if (urlCategory) {
      const normalized = urlCategory.toLowerCase().trim();
      return [QUERY_TO_CATEGORY_MAP[normalized] || urlCategory];
    }
    return [];
  });
  const [selectedSubcategories, setSelectedSubcategories] = useState(() => {
    const subcat = searchParams.get("subcategory") || "";
    if (subcat) return [subcat];
    return [];
  });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [rxOption, setRxOption] = useState("all"); // "all", "rx", "non-rx"
  const [stockOption, setStockOption] = useState("all"); // "all", "in-stock", "out-of-stock"

  const activeCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;

  const SUBCATEGORIES_LIST = useMemo(() => {
    if (!activeCategory) return [];
    const catObj = categories.find(c => c.name.toLowerCase() === activeCategory.toLowerCase());
    if (catObj && catObj.subcategories && catObj.subcategories.length > 0) {
      return catObj.subcategories;
    }
    const filtered = productsData.filter(p => p.category === activeCategory);
    return Array.from(new Set(filtered.map(p => p.subcategory || p.category))).sort();
  }, [productsData, activeCategory, categories]);

  const BRANDS_LIST = useMemo(() => {
    const filtered = activeCategory 
      ? productsData.filter(p => p.category === activeCategory)
      : productsData;
    return Array.from(new Set(filtered.map(p => p.brand))).sort();
  }, [productsData, activeCategory]);

  // 1. Parse URL search parameters on mount or when URL changes (popstate)
  React.useEffect(() => {
    const urlSearchVal = searchParams.get("search") || "";
    const urlCategoryVal = searchParams.get("category") || "";
    const urlSubcategoryVal = searchParams.get("subcategory") || "";
    const urlBrandVal = searchParams.get("brand") || "";
    const urlMaxPriceVal = searchParams.get("maxPrice") || "3000";
    const urlRxVal = searchParams.get("rx") || "all";
    const urlStockVal = searchParams.get("stock") || "all";
    const urlSortVal = searchParams.get("sort") || "Popularity";

    // Synchronize Search query
    if (urlSearchVal !== searchQuery) {
      setSearchQuery(urlSearchVal);
    }

    // Synchronize Categories
    const parsedCats = urlCategoryVal ? [urlCategoryVal.split(",").map(c => {
      const normalized = c.toLowerCase().trim();
      return QUERY_TO_CATEGORY_MAP[normalized] || c;
    })[0]] : [];
    if (JSON.stringify(parsedCats) !== JSON.stringify(selectedCategories)) {
      setSelectedCategories(parsedCats);
    }

    // Synchronize Subcategories
    const parsedSubcats = urlSubcategoryVal ? urlSubcategoryVal.split(",") : [];
    if (JSON.stringify(parsedSubcats) !== JSON.stringify(selectedSubcategories)) {
      setSelectedSubcategories(parsedSubcats);
    }

    // Synchronize Brands
    const parsedBrands = urlBrandVal ? urlBrandVal.split(",") : [];
    if (JSON.stringify(parsedBrands) !== JSON.stringify(selectedBrands)) {
      setSelectedBrands(parsedBrands);
    }

    // Synchronize Max Price
    const parsedMaxPrice = parseInt(urlMaxPriceVal, 10);
    if (!isNaN(parsedMaxPrice) && parsedMaxPrice !== maxPrice) {
      setMaxPrice(parsedMaxPrice);
    }

    // Synchronize Rx Option
    if (urlRxVal !== rxOption) {
      setRxOption(urlRxVal);
    }

    // Synchronize Stock Option
    if (urlStockVal !== stockOption) {
      setStockOption(urlStockVal);
    }

    // Synchronize Sort By
    if (urlSortVal !== sortBy) {
      setSortBy(urlSortVal);
    }
  }, [searchParams]);

  // 2. Update URL search parameters when filters change (debounced for search query)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      
      if (selectedCategories.length > 0) {
        params.set("category", selectedCategories.join(","));
      }
      
      if (selectedSubcategories.length > 0) {
        params.set("subcategory", selectedSubcategories.join(","));
      }
      
      if (selectedBrands.length > 0) {
        params.set("brand", selectedBrands.join(","));
      }
      
      if (maxPrice !== 3000) {
        params.set("maxPrice", maxPrice.toString());
      }
      
      if (rxOption !== "all") {
        params.set("rx", rxOption);
      }
      
      if (stockOption !== "all") {
        params.set("stock", stockOption);
      }
      
      if (sortBy !== "Popularity") {
        params.set("sort", sortBy);
      }
      
      const currentString = searchParams.toString();
      const newString = params.toString();
      if (currentString !== newString) {
        setSearchParams(params, { replace: true });
      }
    }, 300); // 300ms debounce applies to all filter-to-URL sync to buffer fast clicks/slides

    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedBrands, maxPrice, rxOption, stockOption, sortBy, setSearchParams]);

  // Firestore Data Validation & Normalization
  React.useEffect(() => {
    if (!productsData || productsData.length === 0) return;

    const invalidProducts = [];
    productsData.forEach(p => {
      const issues = [];
      if (!p.category || typeof p.category !== "string" || !p.category.trim()) {
        issues.push("missing/invalid category");
      }
      if (!p.brand || typeof p.brand !== "string" || !p.brand.trim()) {
        issues.push("missing/invalid brand");
      }
      if (p.price === undefined || p.price === null || isNaN(Number(p.price)) || Number(p.price) < 0) {
        issues.push("missing/invalid price");
      }
      if (p.stock === undefined || p.stock === null || isNaN(Number(p.stock)) || Number(p.stock) < 0) {
        issues.push("missing/invalid stock");
      }

      if (issues.length > 0) {
        invalidProducts.push({
          id: p.id,
          name: p.medicine_name || "Unnamed Product",
          issues
        });
      }
    });

    if (invalidProducts.length > 0) {
      console.warn("--- FIRESTORE DATA VALIDATION REPORT ---");
      console.warn(`Found ${invalidProducts.length} products with invalid or missing fields:`);
      invalidProducts.forEach(ip => {
        console.warn(`Product ID: ${ip.id} | Name: "${ip.name}" | Issues: ${ip.issues.join(", ")}`);
      });
      console.warn("----------------------------------------");
    }
  }, [productsData]);

  // Filter and Sort logic
  const filteredProducts = useMemo(() => {
    let result = [...productsData];
    const initialCount = result.length;

    // Search query match (Matches name, brand, generic name, category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.medicine_name && p.medicine_name.toLowerCase().includes(q)) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Category filter - Exact trimmed case-insensitive match
    if (selectedCategories.length > 0) {
      const normalizedSelected = selectedCategories.map(c => c.trim().toLowerCase());
      result = result.filter(p => p.category && normalizedSelected.includes(p.category.trim().toLowerCase()));
    } else if (!searchQuery.trim()) {
      // By default, exclude "Lab Tests" from the general catalog browsing to ensure only medicines are displayed
      result = result.filter(p => p.category && p.category.trim().toLowerCase() !== "lab tests");
    }

    // Subcategory filter (if active category is set and subcategories are selected) - Exact trimmed case-insensitive match
    if (activeCategory && selectedSubcategories.length > 0) {
      const normalizedSubcats = selectedSubcategories.map(s => s.trim().toLowerCase());
      result = result.filter(p => {
        const sub = (p.subcategory || p.category || "").trim().toLowerCase();
        return normalizedSubcats.includes(sub);
      });
    }

    // Brand filter - Exact trimmed case-insensitive match (OR logic for multiple selected brands)
    if (selectedBrands.length > 0) {
      const normalizedBrands = selectedBrands.map(b => b.trim().toLowerCase());
      result = result.filter(p => p.brand && normalizedBrands.includes(p.brand.trim().toLowerCase()));
    }

    // Price filter (Max price range check)
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
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedBrands, maxPrice, rxOption, stockOption, sortBy, activeCategory, productsData]);



  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev => {
      const updated = prev.includes(cat) ? [] : [cat];
      setSelectedSubcategories([]);
      return updated;
    });
  };

  const handleSubcategoryToggle = (subcat) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcat) ? prev.filter(s => s !== subcat) : [...prev, subcat]
    );
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setMaxPrice(3000);
    setRxOption("all");
    setStockOption("all");
    setSortBy("Popularity");
    setSearchParams({});
  };

  const getDynamicColor = (percent) => {
    const stages = [
      { r: 16, g: 185, b: 129 },   // Green
      { r: 132, g: 204, b: 22 },   // Lime
      { r: 245, g: 158, b: 11 },   // Yellow/Orange
      { r: 239, g: 68, b: 68 },    // Red
      { r: 153, g: 27, b: 27 }     // Dark Red
    ];

    if (percent <= 0) return `rgb(${stages[0].r}, ${stages[0].g}, ${stages[0].b})`;
    if (percent >= 100) return `rgb(${stages[4].r}, ${stages[4].g}, ${stages[4].b})`;

    const position = percent / 25;
    const index = Math.floor(position);
    const fraction = position - index;

    const c1 = stages[index];
    const c2 = stages[index + 1] || stages[index];

    const r = Math.round(c1.r + (c2.r - c1.r) * fraction);
    const g = Math.round(c1.g + (c2.g - c1.g) * fraction);
    const b = Math.round(c1.b + (c2.b - c1.b) * fraction);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const sliderPercent = ((maxPrice - 40) / (3000 - 40)) * 100;
  const activeColor = getDynamicColor(sliderPercent);

  return (
    <div className="bg-[#F8FCFC] min-h-screen pb-16 font-sans text-dark/90">
      


      {/* 📦 CATALOG CONTAINER */}
      <div className="container mx-auto px-4 pt-2.5 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 🛡️ SIDEBAR FILTERS (DESKTOP) */}
          <aside className="hidden lg:block bg-white border border-dark/5 px-6 py-4 rounded-[24px] shadow-soft space-y-4 h-fit sticky top-24 select-none">
            <div className="flex items-center justify-between border-b border-dark/5 pb-2">
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
            {/* Category or Subcategory Filter */}
            <div className="space-y-2 mt-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-dark uppercase tracking-wider">
                  {activeCategory ? `${activeCategory} Types` : "Categories"}
                </h4>
                {activeCategory && (
                  <button 
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedSubcategories([]);
                      setSearchParams({});
                    }}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    All Categories
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {activeCategory ? (
                  SUBCATEGORIES_LIST.map((subcat) => (
                    <label key={subcat} className="flex items-center gap-2 text-xs text-dark/75 hover:text-primary cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedSubcategories.includes(subcat)}
                        onChange={() => handleSubcategoryToggle(subcat)}
                        className="rounded text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                      />
                      <span>{subcat}</span>
                    </label>
                  ))
                ) : (
                  CATEGORIES_LIST.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-xs text-dark/75 hover:text-primary cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="rounded text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                      />
                      <span>{cat}</span>
                    </label>
                  ))
                )}
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
                max="3000" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(16, 185, 129) 0%, 
                    rgb(132, 204, 22) ${Math.min(25, sliderPercent)}%, 
                    rgb(245, 158, 11) ${Math.min(50, sliderPercent)}%, 
                    rgb(239, 68, 68) ${Math.min(75, sliderPercent)}%, 
                    ${activeColor} ${sliderPercent}%, 
                    #E5E7EB ${sliderPercent}%, 
                    #E5E7EB 100%)`,
                  accentColor: activeColor
                }}
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
          <main className="lg:col-span-3">
            
            {/* 🏷️ HORIZONTAL CATEGORY QUICK-NAV */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSubcategories([]);
                  setSearchParams({});
                }}
                className={`shrink-0 px-4 h-[42px] flex items-center justify-center rounded-full text-xs font-bold transition-all border gap-1.5 shadow-sm active:scale-95 cursor-pointer leading-none ${
                  selectedCategories.length === 0
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-dark/70 border-dark/10 hover:bg-background'
                }`}
              >
                <span>📦</span> All
              </button>
              {CATEGORIES_LIST.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const catObj = categories.find(c => c.name.toLowerCase() === cat.toLowerCase());
                const icon = catObj?.icon || '💊';
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    className={`shrink-0 px-4 h-[42px] flex items-center justify-center rounded-full text-xs font-bold transition-all border gap-1.5 shadow-sm active:scale-95 cursor-pointer leading-none ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-dark/70 border-dark/10 hover:bg-background'
                    }`}
                  >
                    <span>{icon}</span> {cat}
                  </button>
                );
              })}
            </div>

            {/* Header controls bar */}
            <div className="bg-white border border-dark/5 px-4 sm:px-6 py-4 rounded-[20px] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <div className="text-left leading-none">
                <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">Catalog search</span>
                <h2 className="text-base sm:text-lg font-extrabold text-dark mt-1">
                  {urlSearch ? `Results for "${urlSearch}"` : urlCategory ? `Browse Category: ${urlCategory}` : "All Products"}
                </h2>
                <span className="text-xs text-dark/50 font-light mt-0.5 block">{filteredProducts.length} items found</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
                {/* Mobile Filters trigger button */}
                <button 
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-4 py-2 border border-dark/10 rounded-xl hover:bg-background text-xs font-bold text-dark/70 cursor-pointer"
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
            {loading && filteredProducts.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 mt-4">
                <LoadingSkeleton type="card" count={6} />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 mt-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative bg-white border border-dark/5 rounded-xl p-3.5 sm:p-4 shadow-soft premium-card-hover flex flex-col justify-between h-full min-h-[340px] w-full"
                  >
                    {/* Prescription Required Tag */}
                    {product.prescription_required && (
                      <span className="absolute left-3 top-3 bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10 select-none">
                        Rx Required
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-dark/5 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110 cursor-pointer text-dark/45 hover:text-red-500"
                    >
                      {isInWishlist(product.id) ? (
                        <MdFavorite className="text-lg text-red-500 animate-heartBeat" />
                      ) : (
                        <MdFavoriteBorder className="text-lg" />
                      )}
                    </button>

                    <div 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="cursor-pointer flex flex-col flex-grow"
                    >
                      <div className="product-image-container max-[320px]:w-[120px] max-[320px]:h-[120px] max-[320px]:p-2.5 mb-3">
                        <MedicineImage product={product} />
                      </div>
                      <div className="text-left flex-grow flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-dark text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors h-10 overflow-hidden leading-tight text-ellipsis">
                            <Highlight text={product.medicine_name} search={urlSearch} />
                          </h4>
                          <div className="space-y-0.5 mt-1">
                            <p className="text-[10px] text-dark/45 font-semibold truncate leading-none">
                              <Highlight text={product.brand} search={urlSearch} />
                            </p>
                            <p className="text-[9px] text-dark/55 truncate leading-none">
                              {product.pack_size}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-dark/5 text-left shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap h-5">
                        <span className="text-sm font-extrabold text-dark">₹{product.price}</span>
                        {product.mrp > product.price && (
                          <>
                            <span className="text-[10px] text-dark/40 line-through">₹{product.mrp}</span>
                            <span className="bg-secondary/10 text-secondary-dark px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none animate-pulse">
                              {product.discount_percentage}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className={`text-[9px] font-bold mt-1.5 leading-none ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </p>

                      {(() => {
                        const cartItem = cartItems.find((item) => item.id === product.id);
                        const cartQty = cartItem ? cartItem.quantity : 0;
                        if (cartQty > 0) {
                          return (
                            <QuantityStepper
                              quantity={cartQty}
                              onIncrease={() => updateQuantity(product.id, cartQty + 1)}
                              onDecrease={() => updateQuantity(product.id, cartQty - 1)}
                              className="w-full mt-2.5"
                            />
                          );
                        }
                        const isAdding = addingProductId === product.id;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingProductId(product.id);
                              setTimeout(() => {
                                addToCart(product, 1);
                                setAddingProductId(null);
                              }, 400);
                            }}
                            disabled={product.stock <= 0 || isAdding}
                            className={`w-full mt-2.5 py-2 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all select-none shadow-sm ${
                              isAdding
                                ? 'bg-emerald-600 text-white border-emerald-600 scale-[0.98] animate-successPop'
                                : product.stock > 0 
                                  ? 'bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary cursor-pointer' 
                                  : 'bg-dark/5 text-dark/30 border border-dark/5 cursor-not-allowed'
                            }`}
                          >
                            {isAdding ? (
                              <>
                                <MdCheckCircle className="text-xs animate-successPop" />
                                Added
                              </>
                            ) : (
                              <>
                                <MdShoppingCart className="text-xs" />
                                Add to Cart
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card hoverable={false} className="py-16 text-center bg-white border border-dark/5 rounded-[24px] mt-4">
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
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm flex justify-end"
          >
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="w-full max-w-xs bg-white h-full px-6 py-4 shadow-premium overflow-y-auto space-y-4 flex flex-col justify-between"
            >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-dark/5 pb-2">
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

              {/* Category or Subcategory Filter */}
              <div className="space-y-2 mt-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-dark uppercase tracking-wider">
                    {activeCategory ? `${activeCategory} Types` : "Categories"}
                  </h4>
                  {activeCategory && (
                    <button 
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedSubcategories([]);
                        setSearchParams({});
                      }}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                    >
                      All Categories
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {activeCategory ? (
                    SUBCATEGORIES_LIST.map((subcat) => (
                      <label key={subcat} className="flex items-center gap-2 text-xs text-dark/75 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedSubcategories.includes(subcat)}
                          onChange={() => handleSubcategoryToggle(subcat)}
                          className="rounded text-primary border-dark/15 w-4 h-4 cursor-pointer"
                        />
                        <span>{subcat}</span>
                      </label>
                    ))
                  ) : (
                    CATEGORIES_LIST.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-xs text-dark/75 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="rounded text-primary border-dark/15 w-4 h-4 cursor-pointer"
                        />
                        <span>{cat}</span>
                      </label>
                    ))
                  )}
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
                  max="3000" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      rgb(16, 185, 129) 0%, 
                      rgb(132, 204, 22) ${Math.min(25, sliderPercent)}%, 
                      rgb(245, 158, 11) ${Math.min(50, sliderPercent)}%, 
                      rgb(239, 68, 68) ${Math.min(75, sliderPercent)}%, 
                      ${activeColor} ${sliderPercent}%, 
                      #E5E7EB ${sliderPercent}%, 
                      #E5E7EB 100%)`,
                    accentColor: activeColor
                  }}
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
        </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
