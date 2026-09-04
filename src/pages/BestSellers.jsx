import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { useWishlist } from '../context/WishlistContext';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import MedicineImage from '../components/MedicineImage';
import QuantityStepper from '../components/QuantityStepper';
import Button from '../components/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { 
  MdShoppingCart, 
  MdCheckCircle, 
  MdFavorite, 
  MdFavoriteBorder,
  MdKeyboardArrowRight
} from 'react-icons/md';

export default function BestSellers() {
  const { products: productsData, loading } = useProducts();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [allOrders, setAllOrders] = useState([]);
  const [tick, setTick] = useState(0);
  const [visibleCount, setVisibleCount] = useState(10);
  const [addingProductId, setAddingProductId] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isConfigValid && db) {
      const ordersRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), orderId: doc.id });
        });
        setAllOrders(list);
      }, (error) => {
        console.error("Error listening to all orders in BestSellers:", error);
      });
      return unsubscribe;
    } else {
      const fetchLocalOrders = () => {
        const stored = localStorage.getItem('mediquick_local_orders');
        if (stored) {
          setAllOrders(JSON.parse(stored));
        } else {
          setAllOrders([]);
        }
      };
      fetchLocalOrders();
      const handleStorage = (e) => {
        if (e.key === 'mediquick_local_orders') {
          fetchLocalOrders();
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  // Dynamic Best Selling Products calculation
  const bestSellingProducts = useMemo(() => {
    const counts30Days = {};
    const countsAllTime = {};
    const lastOrderDates = {};
    
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - THIRTY_DAYS_MS;

    allOrders.forEach(order => {
      if (order.status === 'Cancelled') return;

      const orderTime = new Date(order.orderDate).getTime();
      const isWithin30Days = orderTime >= cutoffTime;
      const items = order.items || [];
      
      items.forEach(item => {
        if (!item.id) return;
        if (isWithin30Days) {
          counts30Days[item.id] = (counts30Days[item.id] || 0) + (item.quantity || 0);
        }
        countsAllTime[item.id] = (countsAllTime[item.id] || 0) + (item.quantity || 0);

        if (!lastOrderDates[item.id] || orderTime > lastOrderDates[item.id]) {
          lastOrderDates[item.id] = orderTime;
        }
      });
    });

    const sorted = [...productsData].map(p => {
      const count30 = counts30Days[p.id] || 0;
      const countAll = countsAllTime[p.id] || 0;
      const lastOrderTime = lastOrderDates[p.id] || 0;
      return { product: p, count30, countAll, lastOrderTime };
    });

    sorted.sort((a, b) => {
      if (b.count30 !== a.count30) {
        return b.count30 - a.count30;
      }
      if (b.countAll !== a.countAll) {
        return b.countAll - a.countAll;
      }
      if (b.lastOrderTime !== a.lastOrderTime) {
        return b.lastOrderTime - a.lastOrderTime;
      }
      return 0;
    });

    return sorted.map(s => s.product);
  }, [allOrders, productsData, tick]);

  const displayedProducts = useMemo(() => {
    return bestSellingProducts.slice(0, visibleCount);
  }, [bestSellingProducts, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen pb-16 font-sans text-dark/95 text-left">
      
      {/* Page Header */}
      <section className="bg-white py-10 border-b border-dark/5 shadow-soft">
        <div className="container mx-auto px-4">
          <span className="text-[10px] font-black uppercase text-primary-dark tracking-wider">Top Rated</span>
          <h1 className="text-3xl font-extrabold text-dark mt-1">Best Selling Medicines</h1>
          <p className="text-xs text-dark/50 mt-1 max-w-md font-light leading-relaxed">
            Discover the most frequently purchased medicines and healthcare supplies, updated in real-time.
          </p>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="container mx-auto px-4 py-12">
        {loading && displayedProducts.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
            <LoadingSkeleton type="card" count={8} />
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative bg-white border border-dark/5 rounded-xl p-3.5 sm:p-4 shadow-soft premium-card-hover flex flex-col justify-between h-full min-h-[340px] w-full"
                >
                  {product.prescription_required && (
                    <span className="absolute left-3 top-3 bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10 select-none">
                      Rx Required
                    </span>
                  )}

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
                          {product.medicine_name}
                        </h4>
                        <div className="space-y-0.5 mt-1">
                          <p className="text-[10px] text-dark/45 font-semibold truncate leading-none">
                            {product.brand}
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

            {visibleCount < bestSellingProducts.length && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  icon={MdKeyboardArrowRight}
                  iconPosition="right"
                  className="border-primary text-primary hover:bg-primary/5 text-xs py-3.5 px-8 rounded-xl font-bold uppercase tracking-wider transition-all duration-300"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-dark/40 italic text-sm">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}
