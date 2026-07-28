/**
 * Utility for matching coupons/offers and products based on their discount percentage.
 */

/**
 * Finds the matching active, non-expired coupon/offer for a product based on its discount percentage.
 * @param {number|string} productDiscount The product discount percentage (e.g. 10, 20)
 * @param {Array} offers List of offers (from Firestore or local fallback)
 * @returns {Object|null} The matching offer object or null if none found
 */
export function getCouponForProduct(productDiscount, offers) {
  if (productDiscount === undefined || productDiscount === null || !offers || offers.length === 0) {
    return null;
  }
  
  const discountVal = Number(productDiscount);
  if (isNaN(discountVal) || discountVal <= 0) {
    return null;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Find an active, non-expired coupon where discount matches the product's discount percentage
  return offers.find(offer => {
    // Support both discountPercentage and discount properties on the offer object
    const offerDiscount = Number(offer.discountPercentage !== undefined ? offer.discountPercentage : offer.discount);
    const matchesDiscount = offerDiscount === discountVal;
    
    const isOfferActive = offer.status === undefined || offer.status === 'active';
    const isNotExpired = !offer.expiryDate || offer.expiryDate >= todayStr;

    return matchesDiscount && isOfferActive && isNotExpired;
  }) || null;
}

/**
 * Legacy wrapper: Finds matching coupon for a product object containing discount_percentage
 * @param {Object} product The product object
 * @param {Array} coupons List of coupons
 * @returns {Object|null} The matching coupon/offer object
 */
export function getMatchingCouponForProduct(product, coupons) {
  if (!product) return null;
  const productDiscount = product.discountPercentage !== undefined ? product.discountPercentage : product.discount_percentage;
  return getCouponForProduct(productDiscount, coupons);
}

/**
 * Validates if a coupon is applicable to the products currently in the cart.
 * @param {Object} coupon The coupon object to check
 * @param {Array} cartItems The list of items in the cart
 * @returns {boolean} True if the coupon matches the discount percentage of any product in the cart
 */
export function isCouponApplicableToCart(coupon, cartItems) {
  if (!coupon || !cartItems || cartItems.length === 0) {
    return false;
  }
  
  const couponDiscount = Number(coupon.discountPercentage !== undefined ? coupon.discountPercentage : coupon.discount);
  return cartItems.some(item => {
    const itemDiscount = Number(item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage);
    return !isNaN(itemDiscount) && itemDiscount === couponDiscount;
  });
}

/**
 * Calculates the discount amount for the eligible items in the cart.
 * @param {Object} coupon The applied coupon object
 * @param {Array} cartItems The list of items in the cart
 * @returns {number} The discount amount
 */
export function calculateEligibleDiscount(coupon, cartItems) {
  if (!coupon || !cartItems || cartItems.length === 0) return 0;

  const couponDiscount = Number(coupon.discountPercentage !== undefined ? coupon.discountPercentage : coupon.discount);
  const eligibleSubtotal = cartItems.reduce((sum, item) => {
    const itemDiscount = Number(item.discountPercentage !== undefined ? item.discountPercentage : item.discount_percentage);
    if (itemDiscount === couponDiscount) {
      const price = item.offerPrice || item.price || item.mrp || 0;
      return sum + (price * item.quantity);
    }
    return sum;
  }, 0);

  if (eligibleSubtotal === 0) return 0;

  let calculated = 0;
  if (coupon.type === 'percentage') {
    calculated = Math.round((eligibleSubtotal * couponDiscount) / 100);
  } else {
    calculated = Math.round((eligibleSubtotal * couponDiscount) / 100);
  }

  const maxDisc = coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null;
  if (maxDisc && calculated > maxDisc) {
    return maxDisc;
  }

  return Math.min(calculated, eligibleSubtotal);
}
