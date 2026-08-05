import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import MedicineImage from '../components/MedicineImage';
import QuantityStepper from '../components/QuantityStepper';
import { MdShoppingCart, MdFavorite, MdArrowBack } from 'react-icons/md';

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { products, loading: productsLoading } = useProducts();
  const { cartItems, addToCart, updateQuantity } = useCart();

  // Map product IDs in wishlist to full product details from ProductsContext
  const wishlistItems = useMemo(() => {
    if (!products || products.length === 0) return [];
    return wishlistIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  }, [wishlistIds, products]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleRemove = (e, product) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen pb-16 font-sans text-dark/90 text-left">
      {/* 🚀 BACK NAVIGATION */}
      <div className="container mx-auto px-4 py-4">
        <button 
          onClick={() => navigate('/medicines')}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          <MdArrowBack className="text-base" /> Back to Medicines
        </button>
      </div>

      <div className="container mx-auto px-4 mt-2">
        {/* Header Block */}
        <div className="flex items-baseline justify-between border-b border-dark/5 pb-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">My Wishlist</h1>
            <p className="text-xs text-dark/50 mt-1">Saved items you want to monitor or buy later</p>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary-dark px-3 py-1 rounded-full shrink-0">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {productsLoading && wishlistItems.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 select-none">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="relative bg-white border border-dark/5 rounded-xl p-3.5 sm:p-4 shadow-soft premium-card-hover flex flex-col justify-between h-full min-h-[340px] w-full cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Prescription Required Tag */}
                {product.prescription_required && (
                  <span className="absolute left-3 top-3 bg-red-50 text-red-600 border border-red-200/50 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10 select-none">
                    Rx Required
                  </span>
                )}

                {/* Heart/Wishlist Button */}
                <button
                  onClick={(e) => handleRemove(e, product)}
                  className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-dark/5 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110 cursor-pointer text-red-500"
                  title="Remove from wishlist"
                >
                  <MdFavorite className="text-lg text-red-500" />
                </button>

                <div className="flex flex-col flex-grow">
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

                {/* Action Block */}
                <div className="pt-2.5 mt-2.5 border-t border-dark/5 text-left shrink-0">
                  <div className="flex items-center gap-1.5 flex-wrap h-5">
                    <span className="text-sm font-extrabold text-dark">₹{product.price}</span>
                    {product.mrp > product.price && (
                      <>
                        <span className="text-[10px] text-dark/40 line-through">₹{product.mrp}</span>
                        <span className="bg-secondary/10 text-secondary-dark px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none">
                          {product.discount_percentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  
                  <p className={`text-[9px] font-bold mt-1.5 leading-none ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </p>

                  <div className="flex gap-2 mt-2.5">
                    {(() => {
                      const cartItem = cartItems.find((item) => item.id === product.id);
                      const cartQty = cartItem ? cartItem.quantity : 0;
                      if (cartQty > 0) {
                        return (
                          <QuantityStepper
                            quantity={cartQty}
                            onIncrease={() => updateQuantity(product.id, cartQty + 1)}
                            onDecrease={() => updateQuantity(product.id, cartQty - 1)}
                            className="flex-grow"
                          />
                        );
                      }
                      return (
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock <= 0}
                          className={`flex-grow py-2 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all select-none shadow-sm ${
                            product.stock > 0 
                              ? 'bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary cursor-pointer' 
                              : 'bg-dark/5 text-dark/30 border border-dark/5 cursor-not-allowed'
                          }`}
                        >
                          <MdShoppingCart className="text-xs" />
                          Add to Cart
                        </button>
                      );
                    })()}
                    <button
                      onClick={(e) => handleRemove(e, product)}
                      className="px-3 py-2 font-bold text-[10px] rounded-xl border border-dark/10 hover:border-red-200 text-dark/60 hover:text-red-500 hover:bg-red-50/30 transition-all select-none cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white border border-dark/5 rounded-[24px] shadow-soft max-w-lg mx-auto mt-8">
            <div className="text-5xl text-dark/20 mb-4 select-none">❤️</div>
            <h3 className="text-lg font-bold text-dark">Your Wishlist is Empty</h3>
            <p className="text-xs text-dark/50 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Explore our wide range of medicines and healthcare products, and tap the heart icon on any card to save it here.
            </p>
            <button 
              onClick={() => navigate('/medicines')}
              className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Explore Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
