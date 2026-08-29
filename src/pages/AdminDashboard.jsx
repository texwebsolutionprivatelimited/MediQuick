import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import MedicineImage from '../components/MedicineImage';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, doc, query, orderBy, onSnapshot, updateDoc, setDoc, deleteDoc, addDoc, serverTimestamp, collectionGroup, getDocs } from 'firebase/firestore';
import { 
  MdAddCircleOutline, 
  MdCheckCircle, 
  MdClose, 
  MdArrowBack,
  MdInfoOutline,
  MdErrorOutline,
  MdPhotoCamera,
  MdDashboard,
  MdLocalPharmacy,
  MdCategory,
  MdSearch,
  MdEdit,
  MdDelete,
  MdChevronLeft,
  MdChevronRight,
  MdReceipt,
  MdPeople,
  MdFilterList,
  MdMailOutline,
  MdPhone,
  MdConfirmationNumber,
  MdLocalShipping,
  MdSettings,
  MdBook,
  MdMenu,
  MdRateReview,
  MdStar,
  MdStarHalf,
  MdStarBorder,
  MdVisibility,
  MdVisibilityOff
} from 'react-icons/md';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPathname = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, "");
    if (path.endsWith('/dashboard') || path.endsWith('/overview') || path === '/admin') {
      return 'overview';
    }
    if (path.endsWith('/medicines')) {
      return 'medicines';
    }
    if (path.endsWith('/categories')) {
      return 'categories';
    }
    if (path.endsWith('/orders')) {
      return 'orders';
    }
    if (path.endsWith('/prescriptions')) {
      return 'prescriptions';
    }
    if (path.endsWith('/customers') || path.endsWith('/users')) {
      return 'customers';
    }
    if (path.endsWith('/coupons') || path.endsWith('/offers')) {
      return 'coupons';
    }
    if (path.endsWith('/blogs') || path.endsWith('/health-blogs')) {
      return 'blogs';
    }
    if (path.endsWith('/delivery')) {
      return 'delivery';
    }
    if (path.endsWith('/system')) {
      return 'system';
    }
    if (path.endsWith('/reviews') || path.endsWith('/product-reviews')) {
      return 'reviews';
    }
    return 'overview';
  };

  const activeTab = getTabFromPathname(location.pathname);

  const { currentUser, logout } = useAuth();
  const { 
    products, 
    categories, 
    addMedicine, 
    updateMedicine, 
    deleteMedicine,
    addCategory,
    updateCategory,
    deleteCategory,
    updateProductStats,
    isProductsSynced,
    productsSyncError
  } = useProducts();

  const { systemSettings, deliverySettings, saveSystemSettings, saveDeliverySettings } = useSettings();

  // --- PRODUCT REVIEWS TAB STATES & ACTIONS ---
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSearchVal, setReviewSearchVal] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("All");
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState("All");
  const [reviewSortOption, setReviewSortOption] = useState("newest");

  useEffect(() => {
    if (activeTab !== 'reviews') return;

    let unsubscribe = null;
    setReviewsLoading(true);

    if (isConfigValid && db) {
      try {
        const reviewsQuery = collectionGroup(db, 'reviews');
        unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            const pathSegments = docSnap.ref.path.split('/');
            const productId = pathSegments[1];
            list.push({ id: docSnap.id, productId, ...docSnap.data() });
          });
          setAdminReviews(list);
          setReviewsLoading(false);
        }, (err) => {
          console.error("Error subscribing to collectionGroup reviews:", err);
          loadLocalReviews();
        });
      } catch (e) {
        console.error("Error setting up collectionGroup reviews listener:", e);
        loadLocalReviews();
      }
    } else {
      loadLocalReviews();
    }

    function loadLocalReviews() {
      const list = [];
      products.forEach((prod) => {
        const local = localStorage.getItem(`mediquick_reviews_${prod.id}`);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            parsed.forEach((rev) => {
              list.push({ ...rev, productId: prod.id });
            });
          } catch (e) {
            console.error(e);
          }
        }
      });
      setAdminReviews(list);
      setReviewsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab, products]);

  const updateProductAggregateStats = async (productId, currentReviewsList) => {
    const visibleReviews = currentReviewsList.filter(r => r.productId === productId && r.status !== 'hidden');
    const count = visibleReviews.length;
    let avg = 0;
    if (count > 0) {
      const sum = visibleReviews.reduce((acc, r) => acc + Number(r.rating), 0);
      avg = Math.round((sum / count) * 10) / 10;
    }
    await updateProductStats(productId, avg, count);
  };

  const handleToggleReviewVisibility = async (review) => {
    const newStatus = review.status === 'hidden' ? 'visible' : 'hidden';
    const updatedReviews = adminReviews.map(r => r.id === review.id ? { ...r, status: newStatus } : r);
    
    if (isConfigValid && db) {
      try {
        const docRef = doc(db, 'products', review.productId, 'reviews', review.id);
        await updateDoc(docRef, { status: newStatus });
        showToast(`Review status updated to ${newStatus}.`, 'success');
      } catch (err) {
        console.error("Error updating review visibility:", err);
        showToast("Failed to update review status.", 'error');
        return;
      }
    } else {
      const productLocalReviews = updatedReviews.filter(r => r.productId === review.productId);
      localStorage.setItem(`mediquick_reviews_${review.productId}`, JSON.stringify(productLocalReviews));
      setAdminReviews(updatedReviews);
      showToast(`Review status updated to ${newStatus}.`, 'success');
    }

    await updateProductAggregateStats(review.productId, updatedReviews);
  };

  const handleDeleteAdminReview = async (review) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    const updatedReviews = adminReviews.filter(r => r.id !== review.id);

    if (isConfigValid && db) {
      try {
        const docRef = doc(db, 'products', review.productId, 'reviews', review.id);
        await deleteDoc(docRef);
        showToast("Review deleted successfully.", 'success');
      } catch (err) {
        console.error("Error deleting review:", err);
        showToast("Failed to delete review.", 'error');
        return;
      }
    } else {
      const productLocalReviews = updatedReviews.filter(r => r.productId === review.productId);
      localStorage.setItem(`mediquick_reviews_${review.productId}`, JSON.stringify(productLocalReviews));
      setAdminReviews(updatedReviews);
      showToast("Review deleted successfully.", 'success');
    }

    await updateProductAggregateStats(review.productId, updatedReviews);
  };

  const renderAdminReviewStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const adjustFull = rating % 1 >= 0.75 ? 1 : 0;
    const totalFull = fullStars + adjustFull;

    for (let i = 1; i <= 5; i++) {
      if (i <= totalFull) {
        stars.push(<MdStar key={i} className="text-amber-400 text-xs shrink-0" />);
      } else if (i === totalFull + 1 && hasHalf) {
        stars.push(<MdStarHalf key={i} className="text-amber-400 text-xs shrink-0" />);
      } else {
        stars.push(<MdStarBorder key={i} className="text-amber-400 text-xs shrink-0" />);
      }
    }
    return <div className="flex items-center">{stars}</div>;
  };

  const filteredReviews = adminReviews
    .filter((rev) => {
      const prod = products.find((p) => p.id === rev.productId);
      if (!prod) return false;

      const queryStr = reviewSearchVal.toLowerCase();
      const matchProduct = prod.medicine_name.toLowerCase().includes(queryStr);
      const matchUser = rev.userName.toLowerCase().includes(queryStr);
      const matchesSearch = !reviewSearchVal || matchProduct || matchUser;

      const matchesRating = reviewRatingFilter === "All" || Number(rev.rating) === Number(reviewRatingFilter);

      const matchesCategory = reviewCategoryFilter === "All" || prod.category === reviewCategoryFilter;

      return matchesSearch && matchesRating && matchesCategory;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();

      if (reviewSortOption === "newest") return bTime - aTime;
      if (reviewSortOption === "oldest") return aTime - bTime;
      if (reviewSortOption === "highest") return Number(b.rating) - Number(a.rating);
      if (reviewSortOption === "lowest") return Number(a.rating) - Number(b.rating);
      return 0;
    });

  // Custom Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // COD Confirmation Modal States
  const [confirmCodModalOpen, setConfirmCodModalOpen] = useState(false);
  const [codOrderIdToConfirm, setCodOrderIdToConfirm] = useState(null);

  // --- COUPONS TAB STATES & ACTIONS ---
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponSearchVal, setCouponSearchVal] = useState("");
  const [couponStatusFilter, setCouponStatusFilter] = useState("All");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [cpCode, setCpCode] = useState("");
  const [cpDiscount, setCpDiscount] = useState("");
  const [cpDescription, setCpDescription] = useState("");
  const [cpExpiryDate, setCpExpiryDate] = useState("");
  const [cpMinimumOrder, setCpMinimumOrder] = useState("");
  const [cpMaximumDiscount, setCpMaximumDiscount] = useState("");
  const [cpStatus, setCpStatus] = useState("active");
  const [couponFormSaving, setCouponFormSaving] = useState(false);

  const [deleteCouponConfirmOpen, setDeleteCouponConfirmOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  // --- HEALTH BLOGS TAB STATES & ACTIONS ---
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogSearchVal, setBlogSearchVal] = useState("");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("All");
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  const [bgTitle, setBgTitle] = useState("");
  const [bgCategory, setBgCategory] = useState("Heart Health");
  const [bgReadTime, setBgReadTime] = useState("");
  const [bgAuthor, setBgAuthor] = useState("");
  const [bgSummary, setBgSummary] = useState("");
  const [bgImage, setBgImage] = useState("");
  const [bgContent, setBgContent] = useState("");
  const [blogFormSaving, setBlogFormSaving] = useState(false);

  const [deleteBlogConfirmOpen, setDeleteBlogConfirmOpen] = useState(false);
  const [deletingBlog, setDeletingBlog] = useState(null);

  // Sync Blogs from Firestore / LocalStorage
  React.useEffect(() => {
    const defaultArticles = [
      {
        id: "blog-1",
        title: "Understanding Blood Pressure: The Silent Indicator",
        category: "Heart Health",
        readTime: "5 min read",
        author: "Dr. Ramesh Patel, Cardiologist",
        date: "July 12, 2026",
        summary: "What systolic and diastolic pressure numbers actually mean for your cardiovascular health and dynamic daily wellness.",
        image: "/images/blogs/heart-health.jpg",
        content: `Blood pressure measurement is one of the most common diagnostic metrics, yet it remains widely misunderstood. When you receive a reading, it consists of two numbers: systolic pressure (the top number, reflecting the force exerted when the heart beats) and diastolic pressure (the bottom number, representing pressure when the heart rests between beats).

Maintaining blood pressure within the normal range (generally below 120/80 mmHg) is critical. Persistent elevation—known as hypertension—damages blood vessels, increasing the risk of stroke, heart attack, and kidney failure.

### Crucial Steps to Regulate Blood Pressure:
1. **Reduce Sodium Intake**: Keep daily sodium consumption under 2,000 mg.
2. **Engage in Aerobic Exercise**: At least 30 minutes of brisk walking or swimming 5 days a week.
3. **Manage Stress**: Implement mindfulness, breathing routines, or cognitive relaxation.
4. **Follow the DASH Diet**: Focus heavily on potassium-rich foods, whole grains, vegetables, and low-fat dairy products.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-2",
        title: "The Ultimate Guide to Vitamin D and Immunity",
        category: "Nutrition",
        readTime: "4 min read",
        author: "Dr. Ananya Roy, Nutritionist",
        date: "July 10, 2026",
        summary: "Why sunshine alone might not be enough, and how Vitamin D supports bone density and active immune defenses.",
        image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
        content: `Vitamin D acts more like a hormone than a vitamin, impacting everything from calcium absorption to genetic modulation of immune cells. While our bodies can synthesize Vitamin D when exposed to UVB rays, modern indoor lifestyles, pollution, and sunscreen often block this synthesis, leading to widespread deficiencies.

Deficiency can cause chronic fatigue, bone loss, and increased susceptibility to viral infections.

### Key Sources of Vitamin D:
1. **Sun Exposure**: 10 to 15 minutes of midday sun exposure without sunscreen 3 times a week (on face, arms, or back).
2. **Fortified Foods**: Consuming milk, orange juice, and cereals enriched with Vitamin D.
3. **Fatty Fish**: Salmon, mackerel, and sardines are rich natural sources.
4. **Supplements**: Vitamin D3 (Cholecalciferol) supplementation under a doctor's advice, especially during winter months.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-3",
        title: "Managing Type 2 Diabetes: Beyond Medication",
        category: "Diabetes Care",
        readTime: "6 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "July 08, 2026",
        summary: "Empirical lifestyle modifications, glycemic index tracking, and workouts that naturally stabilize blood glucose levels.",
        image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
        content: `Managing Type 2 Diabetes successfully goes far beyond taking daily insulin or oral hypoglycemics. Diet, exercise, and sleep hygiene play a major role in restoring insulin sensitivity and maintaining stable blood glucose levels.

### Lifestyle pillars for glucose control:
1. **Understand Glycemic Index (GI)**: Focus on low-GI foods (like legumes, non-starchy vegetables, and steel-cut oats) that release sugar slowly into the bloodstream.
2. **Strength Training**: Building muscle mass helps absorb glucose directly from the blood without relying heavily on insulin.
3. **Hydration**: Drinking plenty of water helps kidneys flush out excess glucose.
4. **Consistent Sleep Schedules**: Sleep deprivation releases stress hormones like cortisol, which raise blood sugar levels.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-4",
        title: "Coping with Daily Stress: Simple Breathing Techniques",
        category: "Mental Wellness",
        readTime: "3 min read",
        author: "Dr. Samer Joshi, Psychologist",
        date: "July 05, 2026",
        summary: "Quick, research-backed box breathing exercises to lower cortisol levels and heart rate in under 3 minutes.",
        image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&q=80",
        content: `In our fast-paced lives, chronic stress keeps the sympathetic nervous system ('fight-or-flight') constantly activated, causing high heart rates, poor digestion, and elevated blood pressure. Box breathing is a simple, Navy SEAL-approved physiological hack to activate the vagus nerve, trigger the parasympathetic nervous system, and restore calm.

### Step-by-Step Box Breathing Guide:
1. **Inhale**: Breathe in slowly through your nose for 4 seconds, filling your lungs completely.
2. **Hold**: Hold your breath for 4 seconds.
3. **Exhale**: Release the breath slowly through your mouth for 4 seconds.
4. **Hold**: Wait for 4 seconds before starting the next breath.
Repeat this cycle for 3 to 5 minutes to significantly lower cortisol and clear mental fatigue.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-5",
        title: "Heart-Healthy Foods: What Should You Eat?",
        category: "Heart Health",
        readTime: "5 min read",
        author: "Dr. Ramesh Patel, Cardiologist",
        date: "August 14, 2026",
        summary: "Discover which foods actively support cardiovascular health and learn about key ingredients to limit or avoid for a strong heart.",
        image: "/images/blogs/heart_foods.jpg",
        verifiedSource: "American Heart Association (AHA)",
        content: `A heart-healthy dietary pattern is one of the most powerful shields against cardiovascular disease. Making informed choices about what you consume can stabilize blood pressure, improve cholesterol profiles, and decrease systemic inflammation. According to the American Heart Association (AHA), your plate should focus predominantly on nutrient-rich, whole foods.

### Foods That Support Cardiovascular Health:
1. **Fruits and Vegetables**: Loaded with vitamins, minerals, and antioxidants. Aim for a wide variety of colors (leafy greens, berries, carrots) to obtain a diverse spectrum of cardioprotective nutrients.
2. **Whole Grains**: Whole wheat, oats, brown rice, barley, and quinoa are high in dietary fiber, which helps lower blood cholesterol and reduces the risk of heart disease.
3. **Nuts and Seeds**: Walnuts, almonds, flaxseeds, and chia seeds provide healthy unsaturated fats, omega-3 fatty acids, and fiber.
4. **Legumes**: Beans, lentils, and chickpeas are excellent sources of plant-based protein and soluble fiber without the saturated fats found in some animal proteins.
5. **Fish and Lean Proteins**: Fatty fish like salmon, mackerel, and sardines are rich in omega-3 fatty acids, which reduce triglycerides and lower blood pressure. For poultry, choose skinless chicken or turkey.

### What to Limit or Avoid:
To protect your cardiovascular system, the AHA strongly recommends limiting:
- **Excess Sodium**: Aim for less than 2,300 mg per day, ideally moving toward 1,500 mg, to help prevent hypertension.
- **Added Sugars**: Frequently found in soft drinks, pastries, and processed foods, which contribute to weight gain and inflammation.
- **Saturated and Trans Fats**: Limit saturated fats (found in fatty meats and full-fat dairy) and avoid trans fats (found in partially hydrogenated oils) to maintain healthy LDL cholesterol levels.

A sustainable, heart-healthy lifestyle starts with small, daily adjustments. By replacing processed foods with whole, nutrient-dense alternatives, you give your heart the vital resources it needs to function at its best.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-6",
        title: "How Regular Exercise Protects Your Heart",
        category: "Heart Health",
        readTime: "4 min read",
        author: "Dr. Ramesh Patel, Cardiologist",
        date: "August 14, 2026",
        summary: "Understand how physical activity strengthens the cardiac muscle, improves vascular health, and reduces overall cardiovascular risk.",
        image: "/images/blogs/heart_exercise.jpg",
        verifiedSource: "American Heart Association (AHA)",
        content: `Regular physical activity is vital for maintaining a strong cardiovascular system. Just like any other muscle, the heart responds to exercise by becoming stronger and more efficient, enabling it to pump more blood with less effort. The American Heart Association (AHA) recommends at least 150 minutes of moderate-intensity aerobic exercise per week to achieve significant cardiovascular benefits.

### Cardiovascular Benefits of Active Exercise:
1. **Blood Pressure Regulation**: Regular exercise makes your heart stronger. A stronger heart can pump more blood with less effort, reducing the force on your arteries and lowering blood pressure.
2. **Improved Cholesterol Levels**: Physical activity increases high-density lipoprotein (HDL or "good") cholesterol while helping clear low-density lipoprotein (LDL or "bad") cholesterol.
3. **Weight Management**: Combining exercise with a balanced diet helps prevent obesity, which is a major independent risk factor for heart disease.
4. **Blood Sugar Control**: Exercise increases insulin sensitivity, helping muscles use glucose for energy and lowering risk for Type 2 diabetes.

### Practical Activities to Get Moving:
You do not need to train like an elite athlete to protect your heart. Excellent moderate-intensity exercises include:
- **Brisk Walking**: Easy to start, low-impact, and highly effective.
- **Cycling**: A great cardiovascular workout that is gentle on the joints.
- **Swimming**: Engages multiple muscle groups and provides a full-body cardiovascular workout.
- **Moderate Recreational Sports**: Playing tennis, dancing, or working in the garden can all elevate your heart rate into the beneficial aerobic zone.

Start slow if you are returning to activity, and aim for consistency over intensity. Every active minute contributes to a healthier, more resilient heart.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-7",
        title: "Understanding Cholesterol and Its Impact on Heart Health",
        category: "Heart Health",
        readTime: "6 min read",
        author: "Dr. Ramesh Patel, Cardiologist",
        date: "August 14, 2026",
        summary: "Learn the differences between LDL, HDL, and triglycerides, and why regular lipid screening is critical for early prevention.",
        image: "/images/blogs/heart_cholesterol.jpg",
        verifiedSource: "American Heart Association (AHA)",
        content: `Cholesterol is a waxy, fat-like substance circulating in your blood. While your body needs cholesterol to build healthy cells and produce essential hormones, high levels of it can lead to plaque buildup in your arteries. This process, known as atherosclerosis, narrows blood vessels and significantly increases the risk of heart attacks and strokes.

### Breaking Down the Lipid Profile:
1. **LDL (Low-Density Lipoprotein)**: Often called "bad" cholesterol. Excess LDL can accumulate on the walls of your arteries, forming hard plaques that restrict blood flow.
2. **HDL (High-Density Lipoprotein)**: Known as "good" cholesterol. HDL acts as a scavenger, carrying excess cholesterol away from the arteries and back to the liver, where it is broken down and excreted.
3. **Triglycerides**: The most common type of fat in the body. High triglycerides combined with high LDL or low HDL can accelerate plaque buildup in the arterial walls.

### Why Regular Testing Matters:
High cholesterol typically has no symptoms. A person can feel completely healthy while plaque quietly builds inside their arteries. The American Heart Association (AHA) recommends that adults aged 20 or older have their cholesterol and other lipid markers checked every four to six years, or more frequently if they have other risk factors like high blood pressure, diabetes, or a family history of early heart disease.

### Keeping Cholesterol in Check:
Maintaining optimal lipid levels involves a combination of eating fiber-rich foods, exercising regularly, avoiding tobacco, and in some cases, taking doctor-prescribed medications like statins. Understanding your numbers is the first step toward proactive cardiovascular protection.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-8",
        title: "Simple Lifestyle Changes to Reduce Heart Disease Risk",
        category: "Heart Health",
        readTime: "5 min read",
        author: "Dr. Ramesh Patel, Cardiologist",
        date: "August 14, 2026",
        summary: "A practical guide to daily habits that significantly reduce cardiovascular risk, from sleep hygiene to tracking key numbers.",
        image: "/images/blogs/heart_lifestyle.jpg",
        verifiedSource: "American Heart Association (AHA)",
        content: `Preventing heart disease does not require a complete lifestyle overhaul overnight. In fact, small, manageable adjustments to your daily routine can accumulate over time to provide massive protective benefits for your cardiovascular system. The American Heart Association (AHA) highlights several key daily habits that form the foundation of cardiovascular wellness.

### Key Lifestyle Pillars:
1. **Adopt a Balanced Diet**: Focus on vegetables, fruits, whole grains, and lean proteins. Limit processed meats, highly refined carbohydrates, and sugary drinks.
2. **Commit to Regular Exercise**: Walk, swim, cycle, or play sports. Aim for at least 30 minutes of moderate activity most days of the week.
3. **Avoid Tobacco and Nicotine**: Smoking or using e-cigarettes severely damages blood vessels and elevates blood pressure. Quitting is the single most impactful choice you can make for your heart.
4. **Prioritize Quality Sleep**: Chronic sleep deprivation is linked to high blood pressure, increased stress hormones, and weight gain. Aim for 7 to 9 hours of restorative sleep each night.
5. **Manage Stress**: High stress levels can trigger unhealthy coping behaviors. Practice breathing exercises, mindfulness, or regular outdoor walks to lower cortisol levels.
6. **Know and Track Your Numbers**: Regularly check your blood pressure, blood sugar, and cholesterol levels. Work closely with your healthcare provider to keep these parameters within their optimal target ranges.

By incorporating these simple, health-promoting behaviors into your everyday routine, you take active control of your cardiovascular future and greatly reduce your risk of developing heart disease.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-9",
        title: "Managing Everyday Stress: Simple Ways to Feel Better",
        category: "Mental Wellness",
        readTime: "5 min read",
        author: "Dr. Samer Joshi, Psychologist",
        date: "August 14, 2026",
        summary: "Understand what everyday stress is, how it affects your health, and practical lifestyle strategies to manage it effectively.",
        image: "/images/blogs/mental_stress.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Everyday stress is a normal reaction to the demands of life. It is the body's response to challenges or pressures, and while some stress can be motivating, persistent or excessive stress can significantly affect both mental and physical well-being. According to the World Health Organization (WHO), managing stress effectively is a vital component of overall health.

### How Stress Affects You:
Stress can manifest in various ways, including feelings of anxiety, irritability, difficulty concentrating, muscle tension, headaches, and sleep disturbances. Prolonged stress can contribute to long-term health issues such as high blood pressure, weakened immunity, and depressive conditions.

### Practical Strategies to Reduce Stress:
1. **Maintain a Daily Routine**: Having a structured day provides a sense of control and predictability, which naturally lowers anxiety.
2. **Engage in Regular Physical Activity**: Exercise releases endorphins, the body's natural mood lifters, and helps relieve physical tension.
3. **Ensure Adequate Sleep**: Quality sleep restores the brain and body, making you more resilient to daily pressures.
4. **Practice Relaxation Techniques**: Simple methods such as focused breathing, progressive muscle relaxation, or meditation can activate the body's relaxation response.
5. **Stay Connected with Trusted People**: Sharing your feelings with family, friends, or trusted members of your community can provide emotional comfort and practical support.

While these self-care strategies can help manage everyday stress, it is important to remember that persistent, severe, or overwhelming stress that interferes with daily life may require professional support. Seeking help from a mental health professional is a sign of strength and a key step toward recovery.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-10",
        title: "The Importance of Good Sleep for Mental Wellness",
        category: "Mental Wellness",
        readTime: "5 min read",
        author: "Dr. Samer Joshi, Psychologist",
        date: "August 14, 2026",
        summary: "Learn about the vital link between healthy sleep and your mental state, and discover simple habits to build a better bedtime routine.",
        image: "/images/blogs/mental_sleep.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Quality sleep is a fundamental pillar of mental and emotional health. While we sleep, the brain processes the emotional experiences of the day, consolidates memory, and performs essential maintenance functions. The World Health Organization (WHO) highlights that healthy sleep patterns directly support cognitive function, emotional stability, and overall mental well-being.

### The Sleep-Mental Health Connection:
Inadequate sleep can make it harder to regulate emotions, cope with stress, and think clearly. Chronic sleep deprivation is closely linked to increased risks of anxiety, mood disorders, and cognitive decline. On the other hand, restorative sleep enhances concentration, decision-making, and emotional resilience.

### Practical Sleep Habits for General Wellness:
- **Maintain a Consistent Sleep Schedule**: Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body's natural internal clock.
- **Create a Comfortable Sleep Environment**: Keep your bedroom quiet, dark, and cool. Choose comfortable bedding and minimize potential disruptions.
- **Limit Electronic-Device Use Before Bedtime**: The blue light emitted by phones, tablets, and computers interferes with the production of melatonin, the hormone that signals sleep. Avoid screens for at least 30 to 60 minutes before bed.
- **Avoid Heavy Meals Close to Bedtime**: Eating large or heavy meals late in the evening can cause discomfort and disrupt your sleep cycle. Try to finish dinner a few hours before sleeping.
- **Limit Caffeine and Stimulants**: Avoid consuming caffeine or other stimulants in the late afternoon and evening, as they can interfere with your ability to fall asleep.

By making these simple adjustments to your environment and daily habits, you can improve both the duration and quality of your sleep, providing a strong foundation for your mental well-being.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-11",
        title: "Mindfulness and Relaxation Techniques for Mental Well-Being",
        category: "Mental Wellness",
        readTime: "4 min read",
        author: "Dr. Samer Joshi, Psychologist",
        date: "August 14, 2026",
        summary: "An easy-to-understand guide to mindfulness, grounded breathing exercises, and relaxation breaks for everyday life.",
        image: "/images/blogs/mental_mindfulness.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Mindfulness and relaxation techniques are simple, evidence-based practices that can help reduce stress, enhance self-awareness, and support emotional stability. The World Health Organization (WHO) supports the use of these techniques as practical self-care methods to maintain and improve mental well-being in daily life.

### What is Mindfulness?
Mindfulness is the practice of purposely focusing your attention on the present moment—accepting it without judgment. It helps you step back from automatic reactions and observe your thoughts and feelings with curiosity and kindness.

### Simple Techniques to Try:
1. **Focused Breathing**: Spend a few minutes focusing entirely on the sensation of your breath moving in and out of your body. When your mind wanders, gently guide your focus back to your breathing.
2. **Grounding Exercises**: Connect with your surroundings using your senses. For example, use the "5-4-3-2-1" technique: identify five things you can see, four you can touch, three you can hear, two you can smell, and one you can taste.
3. **Noticing Thoughts and Emotions**: Rather than fighting or ignoring difficult thoughts or feelings, simply observe them as if they are clouds passing in the sky. Remember that thoughts are not facts and will eventually pass.
4. **Taking Short Relaxation Breaks**: Set aside 5 to 10 minutes during your day to step away from work or screens, close your eyes, and let your mind rest.

It is important to make it clear that while mindfulness and relaxation techniques can significantly support general well-being, they should not be presented as a replacement for professional treatment when someone has a mental health condition. If you are experiencing persistent mental health difficulties, consult a qualified healthcare provider.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-12",
        title: "Building Healthy Habits for Better Mental Wellness",
        category: "Mental Wellness",
        readTime: "5 min read",
        author: "Dr. Samer Joshi, Psychologist",
        date: "August 14, 2026",
        summary: "Discover how daily habits like healthy eating, sleep, and social connection act as pillars for a healthier mind.",
        image: "/images/blogs/mental_habits.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Our daily habits play a major role in shaping our mental wellness. Small, consistent actions related to how we eat, move, sleep, and interact with others can significantly strengthen our resilience to stress and support long-term emotional health. The World Health Organization (WHO) emphasizes that building healthy habits is a crucial part of promoting and protecting mental well-being.

### Everyday Habits That Support Your Mind:
- **Eat a Balanced Diet**: A nutritious diet supports brain health. Focus on eating plenty of vegetables, fruits, whole grains, and lean proteins, while staying hydrated throughout the day.
- **Stay Physically Active**: Regular physical activity helps reduce anxiety, alleviate depression, and improve mood by releasing beneficial brain chemicals.
- **Get Sufficient Sleep**: Prioritize quality sleep by setting a regular bedtime and creating a restful sleeping environment.
- **Nurture Social Connections**: Spend time talking to and sharing activities with friends, family, or supportive colleagues. Strong social bonds provide emotional security.
- **Take Regular Breaks**: Give your mind time to rest during busy days. Even short breaks of a few minutes can prevent burnout and restore focus.
- **Manage Stress**: Integrate simple stress management tools, like breathing techniques or spending time in nature, into your routine.
- **Make Time for Enjoyable Activities**: Regularly engage in hobbies or activities that bring you joy, satisfaction, or a sense of accomplishment.

Making changes to your habits can take time. Start with one small, achievable goal and build from there. If you find that mental-health difficulties persist, worsen, or interfere with your daily activities, remember to reach out to a healthcare professional for support.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-13",
        title: "Building a Balanced and Healthy Diet",
        category: "Nutrition",
        readTime: "5 min read",
        author: "Dr. Ananya Roy, Nutritionist",
        date: "August 14, 2026",
        summary: "Learn how to build a balanced diet using a variety of nutritious foods and understand the importance of balance, variety, and moderation.",
        description: "Learn how to build a balanced diet using a variety of nutritious foods and understand the importance of balance, variety, and moderation.",
        image: "/images/blogs/nutrition_diet.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `A balanced and healthy diet is essential for maintaining good health and protecting against chronic diseases. In simple terms, eating a balanced diet means consuming a wide variety of nutritious foods in the right proportions to fuel your body and support normal daily function. According to the World Health Organization (WHO), a healthy diet throughout life is fundamental to achieving optimal physical and mental wellness.

### Key Food Groups in a Balanced Diet:
1. **Fruits and Vegetables**: Eat plenty of fresh produce. They are rich in essential vitamins, minerals, and dietary fiber. Aim for at least five portions of fruits and vegetables per day.
2. **Whole Grains**: Choose whole grains such as oats, brown rice, whole wheat, barley, and quinoa over highly refined grains. Whole grains provide sustained energy and support healthy digestion.
3. **Pulses and Legumes**: Beans, lentils, chickpeas, and peas are excellent plant-based protein sources, packed with fiber and micronutrients.
4. **Nuts and Seeds**: Walnuts, almonds, chia seeds, and pumpkin seeds provide essential healthy fats, proteins, and minerals in small, concentrated amounts.
5. **Healthy Fats**: Opt for unsaturated fats (found in olive oil, avocados, and fish) instead of saturated or trans fats.
6. **Protein Sources**: Select lean proteins, eggs, dairy products, fish, or poultry to build and repair muscles and body tissues.

### Variety, Balance, and Individual Needs:
No single food contains all the nutrients your body needs, which is why dietary variety is crucial. Balance means eating the right amount of food from each group, while moderation ensures you do not consume excess calories, sodium, or added sugars.

It is important to remember that nutritional needs are not one-size-fits-all. Individual requirements differ based on your age, gender, lifestyle, activity level, health status, and other personal circumstances. Consulting a registered nutritionist or dietitian can help customize a balanced plan that is perfect for you.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-14",
        title: "Essential Vitamins and Minerals Your Body Needs",
        category: "Nutrition",
        readTime: "6 min read",
        author: "Dr. Ananya Roy, Nutritionist",
        date: "August 14, 2026",
        summary: "Understand the important vitamins and minerals your body needs and discover common foods that can provide these essential nutrients.",
        description: "Understand the important vitamins and minerals your body needs and discover common foods that can provide these essential nutrients.",
        image: "/images/blogs/nutrition_vitamins.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Vitamins and minerals, collectively known as micronutrients, play a critical role in maintaining normal body functions. Although needed in tiny amounts, their absence can lead to severe health deficiencies. The World Health Organization (WHO) emphasizes that obtaining essential micronutrients through a varied diet is a cornerstone of public health and individual well-being.

### Key Essential Micronutrients:
- **Iron**: Crucial for producing hemoglobin, the protein in red blood cells that carries oxygen throughout the body. Found in spinach, lentils, beans, tofu, and lean meats.
- **Calcium**: Essential for developing and maintaining strong bones and teeth, as well as supporting muscle and nerve function. Found in dairy products, fortified plant milks, and leafy greens.
- **Vitamin D**: Helps the body absorb calcium and supports immune function. Sunlight exposure is a major natural source, and it is also found in egg yolks and fortified foods.
- **Vitamin B12**: Vital for nerve function and red blood cell production. Naturally found in animal products (eggs, dairy, meat) and fortified foods. Plant-based eaters should check fortified options.
- **Vitamin C**: A powerful antioxidant that supports skin health, tissue repair, and iron absorption. Richly found in citrus fruits, berries, bell peppers, and tomatoes.
- **Folate**: Critical for cell division and proper DNA synthesis. Especially important during pregnancy to prevent neural tube defects. Found in leafy greens, legumes, and seeds.
- **Iodine**: Required for the synthesis of thyroid hormones that regulate metabolism. Commonly sourced from iodized salt and seafood.
- **Zinc**: Supports immune function, wound healing, and DNA synthesis. Found in seeds, nuts, whole grains, and dairy.

### Meeting Your Micronutrient Needs:
Eating a diverse, colorful diet is the most reliable way for most individuals to secure their daily intake of vitamins and minerals. While supplements can help address specific deficiencies under medical supervision, they are not a replacement for a healthy, varied diet. No single supplement is necessary for everyone; consult a healthcare provider before starting a supplementation routine.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-15",
        title: "The Importance of Protein in a Healthy Diet",
        category: "Nutrition",
        readTime: "5 min read",
        author: "Dr. Ananya Roy, Nutritionist",
        date: "August 14, 2026",
        summary: "Learn why protein is important and explore healthy protein sources including pulses, beans, lentils, nuts, seeds, dairy, eggs, fish, and lean meats.",
        description: "Learn why protein is important and explore healthy protein sources including pulses, beans, lentils, nuts, seeds, dairy, eggs, fish, and lean meats.",
        image: "/images/blogs/nutrition_protein.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Protein is an essential macronutrient necessary for the growth, repair, maintenance, and overall function of every cell in the human body. From building muscles and organs to producing enzymes, hormones, and antibodies, protein serves as the foundation for physical health and metabolic regulation. According to the World Health Organization (WHO), balanced protein intake supports healthy development throughout all stages of life.

### Diverse Sources of Protein:
A healthy diet can incorporate protein from both plant-based and animal-based sources:
- **Plant-Based Sources**: Pulses, beans, lentils, chickpeas, nuts, seeds, tofu, tempeh, and whole grains. These sources are naturally low in saturated fats and high in dietary fiber and essential antioxidants.
- **Animal-Based Sources**: Eggs, dairy products (milk, yogurt, cheese), fish, seafood, and lean meats (poultry). These provide high-quality complete proteins along with vital vitamins like B12.

### Plant vs. Animal Protein in a Balanced Diet:
Both plant and animal proteins offer distinct health benefits. Plant-based proteins promote cardiovascular health and digestion due to their fiber content, but may require combining different sources (e.g., rice and beans) to obtain all essential amino acids. Animal proteins provide all essential amino acids in a single serving but should be selected carefully to limit saturated fats. A balanced approach that incorporates varied sources is highly beneficial.

A healthy protein intake is deeply individual and depends on factors such as age, body composition, activity levels, and overall wellness goals. It is best to avoid generic high-protein diets or rigid intake rules without a professional dietary assessment from a healthcare provider or nutritionist.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-16",
        title: "Understanding Sugar, Salt and Healthy Fats",
        category: "Nutrition",
        readTime: "5 min read",
        author: "Dr. Ananya Roy, Nutritionist",
        date: "August 14, 2026",
        summary: "Understand how sugar, salt, and different types of fats can fit into a healthy diet and learn practical ways to make healthier food choices.",
        description: "Understand how sugar, salt, and different types of fats can fit into a healthy diet and learn practical ways to make healthier food choices.",
        image: "/images/blogs/nutrition_fats.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Making healthy everyday food choices requires a clear understanding of three key components of our diet: sugar, salt, and fat. The World Health Organization (WHO) outlines strong evidence-based guidelines recommending the limitation of free sugars and sodium, alongside a transition toward healthier unsaturated fats, to lower the risk of cardiovascular diseases and diabetes.

### 1. Natural Sugars vs. Free/Added Sugars:
- **Naturally Occurring Sugars**: Found in fresh, whole fruits, vegetables, and milk. These are packed with fiber, vitamins, and minerals that slow down sugar absorption.
- **Free/Added Sugars**: Added to foods and beverages (soda, candies, baked goods) or naturally present in honey, syrups, and fruit juices. High intake of free sugars increases the risk of tooth decay and unhealthy weight gain. Try to limit free sugars to less than 10% of your daily energy intake.

### 2. Salt and Sodium Limitation:
Most people consume too much sodium, largely from processed and packaged foods. High salt intake is directly linked to elevated blood pressure, which increases the risk of heart disease and stroke. WHO recommends limiting daily salt consumption to less than 5 grams (approximately one teaspoon) for adults.

### 3. Understanding Fats:
- **Unsaturated Fats**: The healthiest fats, which support brain function and cholesterol balance. Found in olive oil, avocados, nuts, seeds, and fatty fish.
- **Saturated Fats**: Found in fatty meats, butter, palm oil, and cheese. High consumption can raise LDL cholesterol. Try to limit saturated fats to less than 10% of total energy.
- **Trans Fats**: Highly processed fats found in fried foods, baked goods, and margarine. These should be completely avoided.

### Practical Tips for Everyday Choices:
- Read food labels to check for hidden sugars and sodium levels.
- Cook meals at home using fresh ingredients and flavor foods with herbs and spices instead of excess salt.
- Snack on fresh fruit or raw nuts instead of processed sweets or chips.
- Choose liquid vegetable oils (like olive or sunflower oil) instead of solid fats for cooking.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-17",
        title: "Understanding Blood Sugar and Diabetes",
        category: "Diabetes Care",
        readTime: "5 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "August 14, 2026",
        summary: "Learn what blood glucose is, why managing it is critical for diabetes care, and how lifestyle factors and medication affect your levels.",
        description: "Learn what blood glucose is, why managing it is critical for diabetes care, and how lifestyle factors and medication affect your levels.",
        image: "/images/blogs/diabetes_glucose.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Blood glucose, commonly referred to as blood sugar, is the primary sugar found in your blood. It comes from the food you eat and serves as your body's main source of energy. Your blood carries glucose to all of your body's cells to be used for energy. For individuals living with diabetes, understanding and managing blood glucose levels is a fundamental pillar of health.

### Why Glucose Management is Crucial:
When you have diabetes, your body either does not make enough insulin or cannot effectively use the insulin it produces. Without effective insulin action, glucose builds up in the blood instead of entering the cells. Over time, high levels of blood glucose can damage blood vessels and nerves, leading to serious complications affecting the heart, eyes, kidneys, and feet. Proper management helps prevent this long-term damage.

### Factors That Influence Blood Glucose:
- **Food and Nutrition**: Carbohydrates have the most direct impact on blood glucose, as they are broken down into sugar. Balancing carbohydrates with fiber, proteins, and healthy fats helps stabilize levels.
- **Physical Activity**: Exercise increases insulin sensitivity, meaning your muscle cells are better able to use available insulin to take up glucose during and after activity.
- **Medications**: Insulins and oral medications are designed to help lower blood glucose. Taking them exactly as prescribed is vital.
- **Stress and Illness**: Stress hormones (like cortisol) can cause blood glucose levels to rise.

Because every individual's body responds differently, target blood sugar ranges are personalized. It is important to work with your healthcare team to establish your own target numbers rather than comparing yourself to others.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-18",
        title: "Healthy Eating Tips for Diabetes Care",
        category: "Diabetes Care",
        readTime: "6 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "August 14, 2026",
        summary: "Discover healthy eating tips to support diabetes care, emphasizing whole foods, fiber, and balancing food groups.",
        description: "Discover healthy eating tips to support diabetes care, emphasizing whole foods, fiber, and balancing food groups.",
        image: "/images/blogs/diabetes_meal.jpg",
        verified: true,
        source: "American Diabetes Association (ADA)",
        verifiedSource: "American Diabetes Association (ADA)",
        content: `Healthy eating is a cornerstone of diabetes care. A common misconception is that a diabetes-friendly diet is highly restrictive. In reality, it simply means adopting a balanced, varied, and nutritious eating pattern that supports overall health and helps maintain stable blood glucose levels.

### Key Components of a Balanced Diet:
1. **Vegetables**: Focus on non-starchy vegetables like spinach, broccoli, cauliflower, and peppers. They are rich in vitamins, minerals, and fiber while having a minimal impact on blood glucose.
2. **Whole Grains**: Choose whole grains such as oats, brown rice, quinoa, and whole-wheat bread over highly refined grains. They contain fiber, which slows down glucose absorption.
3. **Pulses and Legumes**: Beans, lentils, and chickpeas are excellent plant-based proteins that also provide rich amounts of fiber.
4. **Healthy Proteins**: Include lean proteins, eggs, dairy, and fish. Omega-3 rich fish (like salmon or mackerel) supports heart health, which is especially important for people with diabetes.
5. **Healthy Fats**: Opt for unsaturated fats from avocados, nuts, seeds, and olive oil to support cardiovascular wellness.

### What to Moderate:
It is highly recommended to limit foods high in free sugars (sugary beverages, sweets, pastries), unhealthy saturated and trans fats, and excess sodium.

Every person's nutritional needs and lifestyle are unique. For a personalized meal plan tailored to your health conditions and cultural preferences, consult a registered dietitian or healthcare professional.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-19",
        title: "Exercise and Physical Activity for People With Diabetes",
        category: "Diabetes Care",
        readTime: "5 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "August 14, 2026",
        summary: "Explore how regular physical activity can safely and effectively support your diabetes management plan.",
        description: "Explore how regular physical activity can safely and effectively support your diabetes management plan.",
        image: "/images/blogs/diabetes_exercise.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Regular physical activity is an extremely effective tool for managing diabetes. When you engage in physical exercise, your muscles use blood glucose for energy, which naturally helps lower your blood sugar levels. Additionally, exercise makes your body more sensitive to insulin, helping it work more efficiently.

### Choosing Appropriate Activities:
A well-rounded activity plan can include:
- **Aerobic Exercise**: Brisk walking, cycling, swimming, or dancing for at least 150 minutes per week.
- **Strength Training**: Lifting light weights or using resistance bands helps build muscle, which absorbs glucose directly from the bloodstream.
- **Flexibility and Balance**: Yoga or stretching supports joint health and mobility.

### Exercising Safely:
It is crucial that any physical activity plan is appropriate for your current health status and any diabetes-related complications you may have (such as neuropathy or retinopathy).

If you have concerns about starting a new routine or have complications, always discuss your exercise plans with your healthcare professional before beginning.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-20",
        title: "Diabetes and Foot Care: Everyday Tips",
        category: "Diabetes Care",
        readTime: "5 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "August 14, 2026",
        summary: "Learn basic daily foot-care habits to prevent complications and protect your health when living with diabetes.",
        description: "Learn basic daily foot-care habits to prevent complications and protect your health when living with diabetes.",
        image: "/images/blogs/diabetes_foot.jpg",
        verified: true,
        source: "American Diabetes Association (ADA)",
        verifiedSource: "American Diabetes Association (ADA)",
        content: `Foot care is an essential but often overlooked aspect of diabetes management. Over time, high blood glucose levels can cause nerve damage (neuropathy) and poor blood flow, particularly in the lower limbs. This means you might not feel a small cut, blister, or sore on your foot, and poor circulation can delay healing, potentially leading to serious infections.

### Basic Daily Foot Care Habits:
- **Check Your Feet Daily**: Inspect your feet every day for cuts, redness, swelling, blisters, or nail changes. Use a mirror if needed to see the bottoms of your feet.
- **Keep Feet Clean and Dry**: Wash your feet daily in lukewarm water. Dry them carefully, especially between the toes, to prevent fungal infections.
- **Moisturize Your Feet**: Apply a moisturizing lotion to the tops and bottoms of your feet to prevent cracking, but avoid applying it between the toes.
- **Wear Appropriate Footwear**: Never walk barefoot, even indoors. Always wear clean, dry socks and well-fitting shoes that do not rub.
- **Seek Prompt Medical Attention**: If you notice a cut, sore, blister, or color change that does not begin to heal after a couple of days, do not attempt to self-treat or diagnose.

Always consult your healthcare professional for any persistent or concerning foot problems.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-21",
        title: "Why Regular Diabetes Checkups Matter",
        category: "Diabetes Care",
        readTime: "5 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "August 14, 2026",
        summary: "Understand why regular diabetes screenings and checkups are vital for preventing complications and monitoring health.",
        description: "Understand why regular diabetes screenings and checkups are vital for preventing complications and monitoring health.",
        image: "/images/blogs/diabetes_checkup.jpg",
        verified: true,
        source: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)",
        verifiedSource: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)",
        content: `Diabetes is a chronic condition that requires consistent, long-term monitoring. Regular checkups and screenings with your healthcare team are vital for tracking your progress, adjusting treatments, and catching any potential complications early when they are easiest to manage.

### Essential Components of Follow-Up Care:
- **HbA1c Tests**: Done 2 to 4 times a year to measure your average blood glucose level over the past 3 months.
- **Blood Pressure and Cholesterol**: Checked regularly to monitor cardiovascular health, as diabetes increases the risk of heart disease.
- **Kidney Function Tests**: Regular urine and blood tests screen for early signs of kidney damage (nephropathy).
- **Dilated Eye Exams**: Annual eye exams check for blood vessel damage in the retina (retinopathy) to prevent vision loss.
- **Professional Foot Exams**: At least once a year, your doctor should check your feet for sensation and circulation.

Building a strong, communicative partnership with your healthcare team through regular appointments is the single best way to ensure you stay on track and live a healthy life with diabetes.`,
        createdAt: new Date().toISOString()
      },
      {
        id: "blog-22",
        title: "Living Well With Diabetes: Building Healthy Daily Habits",
        category: "Diabetes Care",
        readTime: "6 min read",
        author: "Dr. Priya Sen, Endocrinologist",
        date: "August 14, 2026",
        summary: "Build positive, practical daily habits to manage diabetes effectively and improve your overall well-being.",
        description: "Build positive, practical daily habits to manage diabetes effectively and improve your overall well-being.",
        image: "/images/blogs/diabetes_wellness.jpg",
        verified: true,
        source: "World Health Organization (WHO)",
        verifiedSource: "World Health Organization (WHO)",
        content: `Living well with diabetes is about building a series of sustainable, healthy habits that fit naturally into your daily routine. With the right tools and a positive approach, you can manage your condition effectively while enjoying a full and active life.

### Key Daily Habits for Diabetes Wellness:
- **Eat Nutritiously**: Focus on balanced, colorful plates with fiber-rich whole foods, lean proteins, and healthy fats.
- **Stay Active**: Find physical activities you enjoy and aim to do them consistently.
- **Prioritize Sleep**: Aim for 7 to 9 hours of quality sleep, which helps regulate stress hormones and blood glucose.
- **Take Medications as Prescribed**: Adhering to your medication schedule is critical for stable control.
- **Avoid Tobacco**: Smoking accelerates blood vessel damage and increases diabetes complications.
- **Manage Stress**: Practice relaxation techniques, breathing exercises, or hobbies to reduce stress-induced glucose spikes.
- **Schedule Regular Visits**: Keep appointments for screenings and checkups.

Remember that diabetes management is highly individual. Work closely with your healthcare team to personalize your goals and create a plan that supports your unique life.`,
        createdAt: new Date().toISOString()
      }
    ];

    if (isConfigValid && db) {
      setBlogsLoading(true);
      const blogsRef = collection(db, 'blogs');
      const q = query(blogsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id });
        });
        if (list.length === 0) {
          setBlogs(defaultArticles);
        } else {
          setBlogs(list);

          // Auto-seed missing default articles to Firestore if any are absent
          const existingIds = new Set(list.map(a => a.id));
          defaultArticles.forEach(async (art) => {
            if (!existingIds.has(art.id)) {
              try {
                await setDoc(doc(db, 'blogs', art.id), art);
                console.log(`Auto-seeded missing blog to Firestore (AdminDashboard): ${art.title}`);
              } catch (e) {
                console.error("Auto-seeding blog failed in AdminDashboard:", e);
              }
            }
          });
        }
        setBlogsLoading(false);
      }, (error) => {
        console.error("Error listening to blogs in admin:", error);
        setBlogs(defaultArticles);
        setBlogsLoading(false);
      });

      return unsubscribe;
    } else {
      setBlogsLoading(true);
      const savedBlogs = localStorage.getItem('mediquick_local_blogs');
      if (savedBlogs) {
        const parsed = JSON.parse(savedBlogs);
        const parsedMap = new Map(parsed.map(item => [item.id, item]));
        let hasNew = false;
        defaultArticles.forEach(item => {
          if (!parsedMap.has(item.id)) {
            parsed.push(item);
            hasNew = true;
          }
        });
        if (hasNew) {
          localStorage.setItem('mediquick_local_blogs', JSON.stringify(parsed));
        }
        setBlogs(parsed);
      } else {
        setBlogs(defaultArticles);
        localStorage.setItem('mediquick_local_blogs', JSON.stringify(defaultArticles));
      }
      setBlogsLoading(false);
    }
  }, []);

  const openAddBlogModal = () => {
    setEditingBlog(null);
    setBgTitle("");
    setBgCategory("Heart Health");
    setBgReadTime("");
    setBgAuthor("");
    setBgSummary("");
    setBgImage("");
    setBgContent("");
    setBlogModalOpen(true);
  };

  const openEditBlogModal = (blog) => {
    setEditingBlog(blog);
    setBgTitle(blog.title);
    setBgCategory(blog.category);
    setBgReadTime(blog.readTime || "");
    setBgAuthor(blog.author || "");
    setBgSummary(blog.summary || "");
    setBgImage(blog.image || "");
    setBgContent(blog.content || "");
    setBlogModalOpen(true);
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!bgTitle.trim()) {
      showToast("Article Title is required.", "error");
      return;
    }
    if (!bgAuthor.trim()) {
      showToast("Author Name is required.", "error");
      return;
    }
    if (!bgSummary.trim()) {
      showToast("Summary is required.", "error");
      return;
    }
    if (!bgContent.trim()) {
      showToast("Content is required.", "error");
      return;
    }

    setBlogFormSaving(true);
    try {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      });
      const payload = {
        title: bgTitle.trim(),
        category: bgCategory,
        readTime: bgReadTime.trim() || "5 min read",
        author: bgAuthor.trim(),
        date: editingBlog?.date || formattedDate,
        summary: bgSummary.trim(),
        image: bgImage.trim() || "https://images.unsplash.com/photo-1584017911766-6477ef9798f1?auto=format&fit=crop&w=600&q=80",
        content: bgContent,
        updatedAt: new Date().toISOString()
      };

      if (isConfigValid && db) {
        const docRef = editingBlog ? doc(db, 'blogs', editingBlog.id) : doc(collection(db, 'blogs'));
        await setDoc(docRef, {
          ...payload,
          createdAt: editingBlog?.createdAt || new Date().toISOString()
        }, { merge: true });
      } else {
        let updatedList = [...blogs];
        if (editingBlog) {
          updatedList = updatedList.map(b => 
            b.id === editingBlog.id ? { ...b, ...payload } : b
          );
        } else {
          updatedList.unshift({
            id: 'mock-' + Date.now(),
            ...payload,
            createdAt: new Date().toISOString()
          });
        }
        setBlogs(updatedList);
        localStorage.setItem('mediquick_local_blogs', JSON.stringify(updatedList));
      }

      showToast(`Article ${editingBlog ? 'updated' : 'published'} successfully!`);
      setBlogModalOpen(false);
    } catch (err) {
      console.error("Error saving blog article:", err);
      showToast("Failed to save article: " + err.message, "error");
    } finally {
      setBlogFormSaving(false);
    }
  };

  const openDeleteBlogConfirm = (blog) => {
    setDeletingBlog(blog);
    setDeleteBlogConfirmOpen(true);
  };

  const handleDeleteBlogConfirm = async () => {
    if (!deletingBlog) return;
    try {
      if (isConfigValid && db) {
        await deleteDoc(doc(db, 'blogs', deletingBlog.id));
      } else {
        const updatedList = blogs.filter(b => b.id !== deletingBlog.id);
        setBlogs(updatedList);
        localStorage.setItem('mediquick_local_blogs', JSON.stringify(updatedList));
      }
      showToast("Article deleted successfully.");
      setDeleteBlogConfirmOpen(false);
      setDeletingBlog(null);
    } catch (err) {
      console.error("Error deleting blog article:", err);
      showToast("Failed to delete article: " + err.message, "error");
    }
  };

  // Sync Coupons from Firestore / LocalStorage

  React.useEffect(() => {
    if (isConfigValid && db) {
      setCouponsLoading(true);
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id });
        });
        setCoupons(list);
        setCouponsLoading(false);
      }, (error) => {
        console.error("Error listening to coupons:", error);
        setCouponsLoading(false);
      });

      return unsubscribe;
    } else {
      setCouponsLoading(true);
      const savedCoupons = localStorage.getItem('mediquick_local_coupons');
      if (savedCoupons) {
        setCoupons(JSON.parse(savedCoupons));
      } else {
        const defaultCoupons = [
          { id: 'c1', couponCode: 'MED10', discount: 10, description: '10% OFF on all medicines', status: 'active', expiryDate: '2030-12-31', minimumOrder: 0, maximumDiscount: 500, createdAt: new Date().toISOString() },
          { id: 'c2', couponCode: 'QUICK20', discount: 20, description: '20% OFF (First Order)', status: 'active', expiryDate: '2030-12-31', minimumOrder: 100, maximumDiscount: 200, createdAt: new Date().toISOString() },
          { id: 'c3', couponCode: 'FLAT50', discount: 50, description: 'Flat ₹50 OFF', status: 'inactive', expiryDate: '2030-12-31', minimumOrder: 200, maximumDiscount: 50, createdAt: new Date().toISOString() }
        ];
        setCoupons(defaultCoupons);
        localStorage.setItem('mediquick_local_coupons', JSON.stringify(defaultCoupons));
      }
      setCouponsLoading(false);
    }
  }, []);

  const openAddCouponModal = () => {
    setEditingCoupon(null);
    setCpCode("");
    setCpDiscount("");
    setCpDescription("");
    setCpExpiryDate("");
    setCpMinimumOrder("");
    setCpMaximumDiscount("");
    setCpStatus("active");
    setCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon) => {
    setEditingCoupon(coupon);
    setCpCode(coupon.couponCode);
    setCpDiscount(coupon.discount.toString());
    setCpDescription(coupon.description || "");
    setCpExpiryDate(coupon.expiryDate || "");
    setCpMinimumOrder(coupon.minimumOrder ? coupon.minimumOrder.toString() : "");
    setCpMaximumDiscount(coupon.maximumDiscount ? coupon.maximumDiscount.toString() : "");
    setCpStatus(coupon.status || "active");
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!cpCode.trim()) {
      showToast("Coupon Code is required.", "error");
      return;
    }
    const discountNum = Number(cpDiscount);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 100) {
      showToast("Discount must be a percentage between 1% and 100%.", "error");
      return;
    }
    if (!cpExpiryDate) {
      showToast("Expiry Date is required.", "error");
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (cpExpiryDate < todayStr) {
      showToast("Expiry Date cannot be in the past.", "error");
      return;
    }

    const duplicate = coupons.some(c => 
      c.couponCode.trim().toUpperCase() === cpCode.trim().toUpperCase() && 
      c.id !== (editingCoupon?.id || '')
    );
    if (duplicate) {
      showToast("Coupon Code already exists.", "error");
      return;
    }

    setCouponFormSaving(true);
    try {
      const payload = {
        couponCode: cpCode.trim().toUpperCase(),
        discount: discountNum,
        description: cpDescription.trim(),
        expiryDate: cpExpiryDate,
        minimumOrder: cpMinimumOrder ? Number(cpMinimumOrder) : 0,
        maximumDiscount: cpMaximumDiscount ? Number(cpMaximumDiscount) : null,
        status: cpStatus,
        updatedAt: new Date().toISOString()
      };

      if (isConfigValid && db) {
        const docRef = editingCoupon ? doc(db, 'coupons', editingCoupon.id) : doc(collection(db, 'coupons'));
        await setDoc(docRef, {
          ...payload,
          createdAt: editingCoupon?.createdAt || new Date().toISOString()
        }, { merge: true });

        if (!editingCoupon) {
          // Store notification in Firestore for all users
          await addDoc(collection(db, 'notifications'), {
            userId: 'all',
            title: 'New Offer Available!',
            message: `${payload.couponCode}: ${payload.description}`,
            type: 'offers',
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: '/medicines'
          });
        }
      } else {
        let updatedList = [...coupons];
        if (editingCoupon) {
          updatedList = updatedList.map(c => 
            c.id === editingCoupon.id ? { ...c, ...payload } : c
          );
        } else {
          updatedList.push({
            id: 'mock-' + Date.now(),
            ...payload,
            createdAt: new Date().toISOString()
          });

          // Add local mock notification
          const mockNotif = {
            id: `local-offer-${Date.now()}`,
            userId: 'all',
            title: 'New Offer Available!',
            message: `${payload.couponCode}: ${payload.description}`,
            type: 'offers',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/medicines'
          };
          const savedNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
          savedNotifs.unshift(mockNotif);
          localStorage.setItem('mediquick_local_notifications', JSON.stringify(savedNotifs));
        }
        setCoupons(updatedList);
        localStorage.setItem('mediquick_local_coupons', JSON.stringify(updatedList));
      }

      showToast(`Coupon ${editingCoupon ? 'updated' : 'created'} successfully!`);
      setCouponModalOpen(false);
    } catch (err) {
      console.error("Error saving coupon:", err);
      showToast("Failed to save coupon: " + err.message, "error");
    } finally {
      setCouponFormSaving(false);
    }
  };

  const toggleCouponStatus = async (coupon) => {
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    try {
      if (isConfigValid && db) {
        await updateDoc(doc(db, 'coupons', coupon.id), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      } else {
        const updatedList = coupons.map(c => 
          c.id === coupon.id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
        );
        setCoupons(updatedList);
        localStorage.setItem('mediquick_local_coupons', JSON.stringify(updatedList));
      }
      showToast(`Coupon status set to ${newStatus}.`);
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("Failed to update status: " + err.message, "error");
    }
  };

  const openDeleteCouponConfirm = (coupon) => {
    setDeletingCoupon(coupon);
    setDeleteCouponConfirmOpen(true);
  };

  const handleDeleteCouponConfirm = async () => {
    if (!deletingCoupon) return;
    try {
      if (isConfigValid && db) {
        await deleteDoc(doc(db, 'coupons', deletingCoupon.id));
      } else {
        const updatedList = coupons.filter(c => c.id !== deletingCoupon.id);
        setCoupons(updatedList);
        localStorage.setItem('mediquick_local_coupons', JSON.stringify(updatedList));
      }
      showToast("Coupon deleted successfully!");
      setDeleteCouponConfirmOpen(false);
      setDeletingCoupon(null);
    } catch (err) {
      console.error("Error deleting coupon:", err);
      showToast("Failed to delete coupon: " + err.message, "error");
    }
  };

  // --- DELIVERY SETTINGS FORM STATE & ACTIONS ---
  const [delBaseFee, setDelBaseFee] = useState("");
  const [delFreeThreshold, setDelFreeThreshold] = useState("");
  const [delHubLat, setDelHubLat] = useState("");
  const [delHubLng, setDelHubLng] = useState("");
  const [delPriorityRadius, setDelPriorityRadius] = useState("");
  const [delMaxRadius, setDelMaxRadius] = useState("");
  const [delPriorityTime, setDelPriorityTime] = useState("");
  const [delStandardTime, setDelStandardTime] = useState("");
  const [delEnabled, setDelEnabled] = useState(true);
  const [deliverySettingsSaving, setDeliverySettingsSaving] = useState(false);

  React.useEffect(() => {
    if (deliverySettings) {
      setDelBaseFee(deliverySettings.baseDeliveryFee.toString());
      setDelFreeThreshold(deliverySettings.freeDeliveryThreshold.toString());
      setDelHubLat(deliverySettings.hubLatitude.toString());
      setDelHubLng(deliverySettings.hubLongitude.toString());
      setDelPriorityRadius(deliverySettings.priorityRadius.toString());
      setDelMaxRadius(deliverySettings.maximumServiceRadius.toString());
      setDelPriorityTime(deliverySettings.priorityDeliveryTime || "1 Hour");
      setDelStandardTime(deliverySettings.standardDeliveryTime || "24 Hours");
      setDelEnabled(deliverySettings.deliveryEnabled);
    }
  }, [deliverySettings]);

  const handleSaveDeliverySettings = async (e) => {
    e.preventDefault();
    const fee = Number(delBaseFee);
    const thresh = Number(delFreeThreshold);
    const lat = Number(delHubLat);
    const lng = Number(delHubLng);
    const priRad = Number(delPriorityRadius);
    const maxRad = Number(delMaxRadius);

    if (isNaN(fee) || fee < 0) {
      showToast("Base Delivery Fee must be a positive number.", "error");
      return;
    }
    if (isNaN(thresh) || thresh < 0) {
      showToast("Free Delivery Threshold must be a positive number.", "error");
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      showToast("Hub Latitude must be between -90 and 90.", "error");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      showToast("Hub Longitude must be between -180 and 180.", "error");
      return;
    }
    if (isNaN(priRad) || priRad < 0) {
      showToast("Priority Radius must be a positive number.", "error");
      return;
    }
    if (isNaN(maxRad) || maxRad < 0) {
      showToast("Maximum Service Radius must be a positive number.", "error");
      return;
    }
    if (priRad > maxRad) {
      showToast("Priority Radius cannot exceed Maximum Service Radius.", "error");
      return;
    }
    if (!delPriorityTime.trim()) {
      showToast("Priority Delivery Time is required.", "error");
      return;
    }
    if (!delStandardTime.trim()) {
      showToast("Standard Delivery Time is required.", "error");
      return;
    }

    setDeliverySettingsSaving(true);
    try {
      await saveDeliverySettings({
        baseDeliveryFee: fee,
        freeDeliveryThreshold: thresh,
        hubLatitude: lat,
        hubLongitude: lng,
        priorityRadius: priRad,
        maximumServiceRadius: maxRad,
        priorityDeliveryTime: delPriorityTime.trim(),
        standardDeliveryTime: delStandardTime.trim(),
        deliveryEnabled: delEnabled
      });
      showToast("Delivery Settings updated successfully!");
    } catch (err) {
      console.error("Error saving delivery settings:", err);
      showToast("Failed to save settings: " + err.message, "error");
    } finally {
      setDeliverySettingsSaving(false);
    }
  };

  // --- SYSTEM SETTINGS FORM STATE & ACTIONS ---
  const [sysStoreOpen, setSysStoreOpen] = useState(true);
  const [sysPhone, setSysPhone] = useState("");
  const [sysEmail, setSysEmail] = useState("");
  const [sysHours, setSysHours] = useState("");
  const [sysNotifications, setSysNotifications] = useState(true);
  const [sysMaintenance, setSysMaintenance] = useState(false);
  const [systemSettingsSaving, setSystemSettingsSaving] = useState(false);

  React.useEffect(() => {
    if (systemSettings) {
      setSysStoreOpen(systemSettings.storeOpen);
      setSysPhone(systemSettings.supportPhone || "");
      setSysEmail(systemSettings.supportEmail || "");
      setSysHours(systemSettings.operatingHours || "");
      setSysNotifications(systemSettings.enableNotifications);
      setSysMaintenance(systemSettings.maintenanceMode);
    }
  }, [systemSettings]);

  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    if (!sysPhone.trim()) {
      showToast("Support Phone is required.", "error");
      return;
    }
    if (!sysEmail.trim() || !sysEmail.includes("@")) {
      showToast("A valid Support Email is required.", "error");
      return;
    }
    if (!sysHours.trim()) {
      showToast("Operating Hours are required.", "error");
      return;
    }

    setSystemSettingsSaving(true);
    try {
      await saveSystemSettings({
        storeOpen: sysStoreOpen,
        supportPhone: sysPhone.trim(),
        supportEmail: sysEmail.trim(),
        operatingHours: sysHours.trim(),
        enableNotifications: sysNotifications,
        maintenanceMode: sysMaintenance
      });
      showToast("System Settings updated successfully!");
    } catch (err) {
      console.error("Error saving system settings:", err);
      showToast("Failed to save settings: " + err.message, "error");
    } finally {
      setSystemSettingsSaving(false);
    }
  };





  // Responsive Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Prescription Viewer Modal States
  const [selectedRx, setSelectedRx] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(false);

  // --- PRESCRIPTIONS REVIEW STATES & ACTIONS ---
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  // --- ORDERS TAB STATES & ACTIONS ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearchVal, setOrderSearchVal] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- CUSTOMER MANAGEMENT TAB STATES ---
  const [customerSearchVal, setCustomerSearchVal] = useState("");
  const [customerSortOption, setCustomerSortOption] = useState("Newest joined");
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);
  const [viewingCustomerOrders, setViewingCustomerOrders] = useState(null);
  const [dbUsers, setDbUsers] = useState([]);
  const [customerToBlock, setCustomerToBlock] = useState(null);
  const [customerToUnblock, setCustomerToUnblock] = useState(null);

  // Sync Orders from Firestore (or LocalStorage fallback)
  React.useEffect(() => {
    if (isConfigValid && db) {
      setOrdersLoading(true);
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('orderDate', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), orderId: doc.id });
        });
        setOrders(list);
        setOrdersLoading(false);
      }, (error) => {
        console.error("Error listening to orders:", error);
        setOrdersLoading(false);
      });
      
      return unsubscribe;
    } else {
      setOrdersLoading(true);
      const savedOrders = localStorage.getItem('mediquick_local_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        const defaultOrders = [
          {
            orderId: "MQ-82910",
            userId: "user-uid",
            customerName: "John Doe",
            email: "user@mediquick.com",
            phone: "9876543211",
            deliveryAddress: "Flat 302, Block A, Financial District Road, Gachibowli, Hyderabad, 500032",
            items: [
              { id: "prod-001", medicine_name: "Dolo 650 Tablet", price: 30, quantity: 2, brand: "Micro Labs" },
              { id: "prod-002", medicine_name: "Crocin Advance", price: 25, quantity: 1, brand: "GlaxoSmithKline" }
            ],
            totalQuantity: 3,
            totalAmount: 125,
            paymentMethod: "Cash on Delivery (COD)",
            paymentStatus: "Pending",
            orderDate: new Date(Date.now() - 3600000 * 2).toISOString(),
            status: "Pending"
          },
          {
            orderId: "MQ-82911",
            userId: "user-uid-2",
            customerName: "Jane Smith",
            email: "jane.smith@example.com",
            phone: "9876543212",
            deliveryAddress: "Villa 14, Green Meadows, Kondapur, Hyderabad, 500084",
            items: [
              { id: "prod-005", medicine_name: "Digene Gel", price: 130, quantity: 1, brand: "Abbott" },
              { id: "prod-009", medicine_name: "Accu-Chek Glucometer", price: 999, quantity: 1, brand: "Roche" }
            ],
            totalQuantity: 2,
            totalAmount: 1129,
            paymentMethod: "UPI (Google Pay)",
            paymentStatus: "Paid",
            orderDate: new Date(Date.now() - 3600000 * 5).toISOString(),
            status: "Confirmed"
          },
          {
            orderId: "MQ-82912",
            userId: "user-uid-3",
            customerName: "Amit Kumar",
            email: "amit.kumar@gmail.com",
            phone: "9876543213",
            deliveryAddress: "Flat 504, Block C, Jayabheri Silicon County, Hitech City, Hyderabad, 500081",
            items: [
              { id: "prod-006", medicine_name: "Volini Spray", price: 180, quantity: 2, brand: "Sun Pharma" }
            ],
            totalQuantity: 2,
            totalAmount: 400,
            paymentMethod: "Credit / Debit Card",
            paymentStatus: "Paid",
            orderDate: new Date(Date.now() - 3600000 * 12).toISOString(),
            status: "Packed"
          },
          {
            orderId: "MQ-82913",
            userId: "user-uid-4",
            customerName: "Priya Patel",
            email: "priya.patel@yahoo.com",
            phone: "9876543214",
            deliveryAddress: "H.No 12-4-91, Pragathi Nagar, Kukatpally, Hyderabad, 500090",
            items: [
              { id: "prod-007", medicine_name: "Vicks Vaporub", price: 145, quantity: 3, brand: "Procter & Gamble" }
            ],
            totalQuantity: 3,
            totalAmount: 475,
            paymentMethod: "UPI (PhonePe)",
            paymentStatus: "Paid",
            orderDate: new Date(Date.now() - 3600000 * 24).toISOString(),
            status: "Out for Delivery"
          },
          {
            orderId: "MQ-82914",
            userId: "user-uid-5",
            customerName: "Rohan Sharma",
            email: "rohan.sharma@outlook.com",
            phone: "9876543215",
            deliveryAddress: "Apt 202, Sunrise Towers, Madhapur, Hyderabad, 500081",
            items: [
              { id: "prod-010", medicine_name: "Omron BP Monitor", price: 1850, quantity: 1, brand: "Omron" },
              { id: "prod-008", medicine_name: "Electral ORS", price: 20, quantity: 10, brand: "FDC" }
            ],
            totalQuantity: 11,
            totalAmount: 2050,
            paymentMethod: "UPI (Paytm)",
            paymentStatus: "Paid",
            orderDate: new Date(Date.now() - 3600000 * 48).toISOString(),
            status: "Delivered"
          },
          {
            orderId: "MQ-82915",
            userId: "user-uid-6",
            customerName: "Vikram Reddy",
            email: "vikram.reddy@example.com",
            phone: "9876543216",
            deliveryAddress: "Plot 89, Phase 2, Kavuri Hills, Madhapur, Hyderabad, 500033",
            items: [
              { id: "prod-003", medicine_name: "Calpol 650", price: 24, quantity: 5, brand: "GlaxoSmithKline" }
            ],
            totalQuantity: 5,
            totalAmount: 160,
            paymentMethod: "Cash on Delivery (COD)",
            paymentStatus: "Pending",
            orderDate: new Date(Date.now() - 3600000 * 72).toISOString(),
            status: "Cancelled"
          }
        ];
        setOrders(defaultOrders);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(defaultOrders));
      }
      setOrdersLoading(false);

      // Listen to storage changes for real-time synchronization in mock mode
      const handleStorageChange = (e) => {
        if (e.key === 'mediquick_local_orders') {
          if (e.newValue) {
            setOrders(JSON.parse(e.newValue));
          }
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Sync Prescriptions from Firestore (with local fallback if offline or no config)
  useEffect(() => {
    if (isConfigValid && db) {
      setPrescriptionsLoading(true);
      const prescriptionsRef = collection(db, 'prescriptions');
      const q = query(prescriptionsRef, orderBy('uploadTime', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });
        setPrescriptions(list);
        setPrescriptionsLoading(false);
      }, (error) => {
        console.error("Error listening to prescriptions:", error);
        setPrescriptionsLoading(false);
      });
      
      return unsubscribe;
    } else {
      setPrescriptionsLoading(true);
      const savedPrescriptions = localStorage.getItem('mediquick_local_prescriptions');
      if (savedPrescriptions) {
        setPrescriptions(JSON.parse(savedPrescriptions));
      } else {
        setPrescriptions([]);
      }
      setPrescriptionsLoading(false);
    }
  }, []);

  // Sync Users from Firestore (with local fallback if offline or no config)
  useEffect(() => {
    if (isConfigValid && db) {
      const usersRef = collection(db, 'users');
      const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ uid: doc.id, ...doc.data() });
        });
        setDbUsers(list);
      }, (error) => {
        console.error("Error listening to users:", error);
      });
      return unsubscribeUsers;
    } else {
      const syncMockUsers = () => {
        const savedUsers = localStorage.getItem('mediquick_users');
        if (savedUsers) {
          setDbUsers(JSON.parse(savedUsers));
        }
      };
      syncMockUsers();
      window.addEventListener('storage', syncMockUsers);
      return () => window.removeEventListener('storage', syncMockUsers);
    }
  }, []);

  const handleConfirmBlock = async (cust) => {
    try {
      const emailLower = cust.email.toLowerCase().trim();
      const matched = dbUsers.find(u => u.email?.toLowerCase().trim() === emailLower);
      
      if (isConfigValid && db) {
        if (matched) {
          const userRef = doc(db, 'users', matched.uid);
          await updateDoc(userRef, { isBlocked: true });
        } else {
          // If no user exists, create one with isBlocked: true
          const newUid = `blocked-uid-${Date.now()}`;
          const userRef = doc(db, 'users', newUid);
          await setDoc(userRef, {
            email: cust.email,
            fullName: cust.name,
            role: 'user',
            isBlocked: true,
            createdAt: new Date().toISOString()
          });
        }
        showToast(`Customer ${cust.name} blocked successfully.`, 'success');
      } else {
        // Mock update
        const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
        const matchedMockIndex = users.findIndex(u => u.email?.toLowerCase().trim() === emailLower);
        if (matchedMockIndex > -1) {
          users[matchedMockIndex].isBlocked = true;
        } else {
          users.push({
            uid: `mock-uid-${Date.now()}`,
            fullName: cust.name,
            email: cust.email,
            role: 'user',
            isBlocked: true,
            createdAt: new Date().toISOString()
          });
        }
        localStorage.setItem('mediquick_users', JSON.stringify(users));
        setDbUsers(users);
        showToast(`Customer ${cust.name} blocked locally.`, 'success');
      }
    } catch (err) {
      console.error("Error blocking customer:", err);
      showToast(`Failed to block customer: ${err.message}`, 'error');
    }
  };

  const handleConfirmUnblock = async (cust) => {
    try {
      const emailLower = cust.email.toLowerCase().trim();
      const matched = dbUsers.find(u => u.email?.toLowerCase().trim() === emailLower);
      
      if (isConfigValid && db) {
        if (matched) {
          const userRef = doc(db, 'users', matched.uid);
          await updateDoc(userRef, { isBlocked: false });
        } else {
          // If no user exists, create one with isBlocked: false
          const newUid = `blocked-uid-${Date.now()}`;
          const userRef = doc(db, 'users', newUid);
          await setDoc(userRef, {
            email: cust.email,
            fullName: cust.name,
            role: 'user',
            isBlocked: false,
            createdAt: new Date().toISOString()
          });
        }
        showToast(`Customer ${cust.name} unblocked successfully.`, 'success');
      } else {
        // Mock update
        const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
        const matchedMockIndex = users.findIndex(u => u.email?.toLowerCase().trim() === emailLower);
        if (matchedMockIndex > -1) {
          users[matchedMockIndex].isBlocked = false;
        } else {
          users.push({
            uid: `mock-uid-${Date.now()}`,
            fullName: cust.name,
            email: cust.email,
            role: 'user',
            isBlocked: false,
            createdAt: new Date().toISOString()
          });
        }
        localStorage.setItem('mediquick_users', JSON.stringify(users));
        setDbUsers(users);
        showToast(`Customer ${cust.name} unblocked locally.`, 'success');
      }
    } catch (err) {
      console.error("Error unblocking customer:", err);
      showToast(`Failed to unblock customer: ${err.message}`, 'error');
    }
  };

  const handleAdminUpdatePrescriptionStatus = async (rxId, status, reason = "") => {
    if (isConfigValid && db) {
      try {
        const docRef = doc(db, 'prescriptions', rxId);
        await updateDoc(docRef, {
          reviewStatus: status,
          rejectionReason: reason
        });
        showToast(`Prescription status updated to ${status}.`, 'success');
      } catch (err) {
        console.error("Error updating prescription status in Firestore:", err);
        showToast(`Failed to update status in Firestore: ${err.message}`, 'error');
      }
    } else {
      // Local fallback update
      const updatedList = prescriptions.map(rx => rx.id === rxId ? { ...rx, reviewStatus: status, rejectionReason: reason } : rx);
      setPrescriptions(updatedList);
      localStorage.setItem('mediquick_local_prescriptions', JSON.stringify(updatedList));
      showToast(`Prescription status updated locally to ${status}.`, 'success');
    }
  };

  // Prescription Viewer Actions
  const handleOpenPrescriptionModal = (rx) => {
    setSelectedRx(rx);
    setZoomScale(1);
    setModalLoading(true);
    setModalError(false);
    document.body.style.overflow = 'hidden';
  };

  const handleClosePrescriptionModal = () => {
    setSelectedRx(null);
    setZoomScale(1);
    setModalLoading(false);
    setModalError(false);
    document.body.style.overflow = '';
  };

  const handleDownloadFile = async (url, fileName) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'prescription';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedRx(null);
        setZoomScale(1);
        setModalLoading(false);
        setModalError(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRx]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      const userId = order?.userId;

      // Rule: For COD orders, the order must NOT become Delivered until the Admin confirms payment.
      const isCOD = order?.paymentMethod === 'COD' || order?.paymentMethod === 'Cash on Delivery (COD)';
      if (newStatus === 'Delivered' && isCOD && order?.paymentStatus !== 'Paid') {
        alert("Please confirm COD payment before marking this order as delivered.");
        return;
      }

      const updateData = { status: newStatus };
      if (newStatus === 'Delivered' && !order?.deliveredAt) {
        updateData.deliveredAt = serverTimestamp();
        updateData.returnEligibleUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      if (isConfigValid && db) {
        // Update in root orders collection (for Admin Console)
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);

        // Update in user subcollection (for user-side tracking)
        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, updateData).catch(err => {
            console.warn("Could not sync user orders subcollection status (document might not exist):", err);
          });

          // Generate notification in Firestore
          await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: `Order Update - ${newStatus}`,
            message: `Your order #${orderId} status has been updated to ${newStatus}.`,
            type: 'order_status',
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: '/order-tracking'
          });
        }
      } else {
        const localDeliveredAt = new Date().toISOString();
        const updated = orders.map(ord => {
          if (ord.orderId === orderId) {
            const up = { ...ord, status: newStatus };
            if (newStatus === 'Delivered' && !up.deliveredAt) {
              up.deliveredAt = localDeliveredAt;
              up.returnEligibleUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            }
            return up;
          }
          return ord;
        });
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));

        // Add local mock notification
        if (userId && userId !== 'guest') {
          const mockNotif = {
            id: `local-status-${Date.now()}`,
            userId: userId,
            title: `Order Update - ${newStatus}`,
            message: `Your order #${orderId} status has been updated to ${newStatus}.`,
            type: 'order_status',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/order-tracking'
          };
          const savedNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
          savedNotifs.unshift(mockNotif);
          localStorage.setItem('mediquick_local_notifications', JSON.stringify(savedNotifs));
        }
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleUpdateReturnStatus = async (orderId, newReturnStatus) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      const userId = order?.userId;

      if (newReturnStatus === 'approved') {
        const confirmApprove = window.confirm("Are you sure you want to approve this return?");
        if (!confirmApprove) return;
      }

      const updateData = { returnStatus: newReturnStatus };
      if (newReturnStatus === 'approved') {
        updateData.returnApprovedAt = new Date().toISOString();
        updateData.refundStatus = 'Refund Not Started';
        updateData.refundAmount = Number(order.totalAmount || 0);
      }

      if (isConfigValid && db) {
        // Update in root orders collection
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);

        // Update in user subcollection
        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, updateData).catch(err => {
            console.warn("Could not sync user orders subcollection status:", err);
          });
        }
      } else {
        // Update mock local storage
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === orderId ? { ...o, ...updateData } : o
        );
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));
      }
      
      // Update selectedOrder if open in modal
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updateData }));
      }

      alert(`Return status updated to ${newReturnStatus} successfully.`);
    } catch (err) {
      console.error("Error updating return status:", err);
      alert("Failed to update return status: " + err.message);
    }
  };

  const handleMarkRefundSuccessful = async (orderId) => {
    try {
      // Authorization Check: Ensure current user is admin
      if (!currentUser || currentUser.role !== 'admin') {
        alert("Unauthorized. Only administrators can perform this action.");
        return;
      }

      const order = orders.find(o => o.orderId === orderId);
      if (!order) {
        alert("Order not found.");
        return;
      }
      const userId = order.userId;

      // Prevent duplicate refunds
      if (order.refundStatus === 'Refund Successful' || order.refundStatus === 'successful') {
        alert("Refund has already been processed and marked as successful.");
        return;
      }

      // Show confirmation dialog
      const confirmRefund = window.confirm("Are you sure you want to mark this refund as successful?");
      if (!confirmRefund) return;

      const localTimestamp = new Date().toISOString();
      const updateData = {
        refundStatus: 'Refund Successful',
        refundProcessedAt: isConfigValid && db ? serverTimestamp() : localTimestamp,
        returnStatus: 'completed'
      };

      if (isConfigValid && db) {
        // Update in root orders collection
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);

        // Update in user orders subcollection for completeness
        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, updateData).catch(err => {
            console.warn("Could not sync user orders subcollection refund info:", err);
          });

          // Generate notification in Firestore
          await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: 'Refund Processed',
            message: `The refund of ₹${order.totalAmount} for your return request on order #${orderId} was processed successfully.`,
            type: 'order_status',
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: '/order-tracking'
          });
        }
      } else {
        // Update mock local storage
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === orderId ? { ...o, ...updateData } : o
        );
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));

        // Add local mock notification
        if (userId && userId !== 'guest') {
          const mockNotif = {
            id: `local-refund-${Date.now()}`,
            userId: userId,
            title: 'Refund Processed',
            message: `The refund of ₹${order.totalAmount} for your return request on order #${orderId} was processed successfully.`,
            type: 'order_status',
            isRead: false,
            createdAt: localTimestamp,
            actionUrl: '/order-tracking'
          };
          const savedNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
          savedNotifs.unshift(mockNotif);
          localStorage.setItem('mediquick_local_notifications', JSON.stringify(savedNotifs));
        }
      }

      // Update selectedOrder modal if open
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updateData }));
      }

      alert("Refund marked as successful and return completed.");
    } catch (err) {
      console.error("Error marking refund as successful:", err);
      alert("Failed to update refund status: " + err.message);
    }
  };

  const handleProcessRefund = async (orderId) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      if (!order) return;
      const userId = order.userId;

      // Prevent duplicate refunds
      if (order.refundStatus === 'completed') {
        alert("Refund Already Completed");
        return;
      }

      const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery (COD)';
      let updateData = {};

      if (isCOD) {
        // For COD, verify refund details are provided
        if (!order.refundMethod) {
          alert("Waiting for customer to provide refund details.");
          return;
        }

        const maskedAcc = order.refundDetails?.accountNumber 
          ? 'XXXXXX' + order.refundDetails.accountNumber.slice(-4)
          : 'N/A';
        const detailsStr = order.refundMethod === 'UPI' 
          ? `UPI ID: ${order.refundDetails?.upiId}`
          : `Bank: ${order.refundDetails?.bankName || 'N/A'}, Account: ${maskedAcc}, Name: ${order.refundDetails?.accountHolderName}`;

        const confirmRefund = window.confirm(
          `Confirm refunding ₹${order.totalAmount} to customer via ${order.refundMethod}?\nDetails: ${detailsStr}`
        );
        if (!confirmRefund) return;

        updateData = {
          refundStatus: 'completed',
          refundCompletedAt: new Date().toISOString(),
          returnStatus: 'completed',
          refundTransactionId: 'ref_cod_' + Math.random().toString(36).substr(2, 9)
        };
      } else {
        // Online refund - call server-side function
        const confirmOnlineRefund = window.confirm(
          `Are you sure you want to trigger payment gateway refund of ₹${order.totalAmount} for order #${orderId}?`
        );
        if (!confirmOnlineRefund) return;

        // Perform HTTP POST to secure backend handler
        const response = await fetch('/api/process-refund', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: orderId,
            refundAmount: order.totalAmount
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Payment gateway refund failed.');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Payment gateway refund rejected.');
        }

        updateData = {
          refundStatus: 'completed',
          refundCompletedAt: data.refundedAt || new Date().toISOString(),
          returnStatus: 'completed',
          refundTransactionId: data.refundTransactionId
        };
      }

      // Persist updates to DB
      if (isConfigValid && db) {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);

        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, updateData).catch(err => {
            console.warn("Could not sync user orders subcollection refund info:", err);
          });
        }
      } else {
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === orderId ? { ...o, ...updateData } : o
        );
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));
      }

      // Update selectedOrder modal if open
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updateData }));
      }

      alert("Refund processed successfully and marked as completed.");
    } catch (err) {
      console.error("Refund error:", err);
      alert("Failed to process refund: " + err.message);
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      const userId = order?.userId;

      const updateData = { paymentStatus: 'Paid' };

      if (isConfigValid && db) {
        // Update in root orders collection
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);

        // Update in user subcollection
        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, updateData).catch(err => {
            console.warn("Could not sync user orders subcollection payment status:", err);
          });
        }
      } else {
        // Update mock local storage
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === orderId ? { ...o, ...updateData } : o
        );
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));
      }

      // Update selectedOrder if open in modal
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updateData }));
      }

      alert("Order payment status updated to Paid successfully.");
    } catch (err) {
      console.error("Error marking order as paid:", err);
      alert("Failed to update payment status: " + err.message);
    }
  };

  const handleRequestCodConfirmation = (orderId) => {
    setCodOrderIdToConfirm(orderId);
    setConfirmCodModalOpen(true);
  };

  const handleConfirmCodPayment = async (orderId) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      const userId = order?.userId;
      const localTimestamp = new Date().toISOString();
      const localReturnEligibleUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const updateData = { 
        paymentStatus: 'Paid',
        paymentConfirmedAt: isConfigValid && db ? serverTimestamp() : localTimestamp,
        status: 'Delivered',
        deliveredAt: isConfigValid && db ? serverTimestamp() : localTimestamp,
        returnEligibleUntil: localReturnEligibleUntil
      };

      if (isConfigValid && db) {
        // Update in root orders collection
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);

        // Update in user subcollection
        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, updateData).catch(err => {
            console.warn("Could not sync user orders subcollection payment and status:", err);
          });

          // Generate notification in Firestore
          await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: `Payment Confirmed & Order Delivered`,
            message: `Your payment of ₹${order.totalAmount} for order #${orderId} was confirmed. Status: Delivered.`,
            type: 'order_status',
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: '/order-tracking'
          });
        }
      } else {
        // Update mock local storage
        const stored = JSON.parse(localStorage.getItem('mediquick_local_orders') || '[]');
        const updated = stored.map(o => 
          o.orderId === orderId ? { 
            ...o, 
            paymentStatus: 'Paid',
            paymentConfirmedAt: localTimestamp,
            status: 'Delivered',
            deliveredAt: localTimestamp,
            returnEligibleUntil: localReturnEligibleUntil
          } : o
        );
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));

        // Add local mock notification
        if (userId && userId !== 'guest') {
          const mockNotif = {
            id: `local-cod-${Date.now()}`,
            userId: userId,
            title: `Payment Confirmed & Order Delivered`,
            message: `Your payment of ₹${order.totalAmount} for order #${orderId} was confirmed. Status: Delivered.`,
            type: 'order_status',
            isRead: false,
            createdAt: localTimestamp,
            actionUrl: '/order-tracking'
          };
          const savedNotifs = JSON.parse(localStorage.getItem('mediquick_local_notifications') || '[]');
          savedNotifs.unshift(mockNotif);
          localStorage.setItem('mediquick_local_notifications', JSON.stringify(savedNotifs));
        }
      }

      // Update selectedOrder if open in modal
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          paymentStatus: 'Paid',
          paymentConfirmedAt: localTimestamp,
          status: 'Delivered',
          deliveredAt: localTimestamp,
          returnEligibleUntil: localReturnEligibleUntil
        }));
      }

      alert("COD payment confirmed. Order status updated to Delivered successfully.");
    } catch (err) {
      console.error("Error confirming COD payment:", err);
      alert("Failed to confirm COD payment: " + err.message);
    }
  };

  // --- MEDICINE TAB STATES ---
  const [medSearchVal, setMedSearchVal] = useState("");
  const [medCategoryFilter, setMedCategoryFilter] = useState("All");
  const [medCurrentPage, setMedCurrentPage] = useState(1);
  const [medsPerPage] = useState(10);

  // Add Medicine Form State
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [addMedData, setAddMedData] = useState({
    medicine_name: '',
    generic_name: '',
    brand: '',
    category: '',
    subcategory: '',
    strength: '',
    form: 'Tablet',
    pack_size: 'Strip of 10 Tablets',
    price: '',
    mrp: '',
    stock: '',
    prescription_required: false,
    description: '',
    manufacturer: '',
    composition: '',
    uses: '',
    image_url: ''
  });
  const [addMedImageFile, setAddMedImageFile] = useState(null);
  const [addMedImagePreview, setAddMedImagePreview] = useState(null);
  const [addMedError, setAddMedError] = useState(null);
  const [addMedSuccess, setAddMedSuccess] = useState(null);

  // Edit Medicine Form State
  const [editMedModalOpen, setEditMedModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState(null);
  const [editMedData, setEditMedData] = useState({
    medicine_name: '',
    generic_name: '',
    brand: '',
    category: '',
    subcategory: '',
    strength: '',
    form: 'Tablet',
    pack_size: 'Strip of 10 Tablets',
    price: '',
    mrp: '',
    stock: '',
    prescription_required: false,
    description: '',
    manufacturer: '',
    composition: '',
    uses: '',
    image_url: '',
    image_url_2: '',
    image_url_3: ''
  });
  const [editMedImageFile, setEditMedImageFile] = useState(null);
  const [editMedImagePreview, setEditMedImagePreview] = useState(null);
  const [editMedError, setEditMedError] = useState(null);
  const [editMedSuccess, setEditMedSuccess] = useState(null);

  // Medicine Delete State
  const [deleteMedConfirmOpen, setDeleteMedConfirmOpen] = useState(false);
  const [deletingMed, setDeletingMed] = useState(null);

  // --- CATEGORY TAB STATES ---
  // Add Category State
  const [addCatModalOpen, setAddCatModalOpen] = useState(false);
  const [addCatData, setAddCatData] = useState({
    name: '',
    description: '',
    icon: '💊',
    status: 'active',
    subcategories: ''
  });
  const [addCatError, setAddCatError] = useState(null);
  const [addCatSuccess, setAddCatSuccess] = useState(null);

  // Edit Category State
  const [editCatModalOpen, setEditCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({
    name: '',
    description: '',
    icon: '💊',
    status: 'active',
    subcategories: ''
  });
  const [editCatError, setEditCatError] = useState(null);
  const [editCatSuccess, setEditCatSuccess] = useState(null);

  // Category Delete State
  const [deleteCatConfirmOpen, setDeleteCatConfirmOpen] = useState(false);
  const [deletingCat, setDeletingCat] = useState(null);

  // Forms Select Lists
  const formsList = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Spray', 'Powder', 'Balm', 'Device'];
  const iconList = ['💊', '🧴', '🩸', '❤️', '🧼', '🧸', '🌿', '🥤', '⌚', '✨', '🤒', '🤕', '🌡️', '🩺'];

  // Setup Default Category when categories change
  React.useEffect(() => {
    if (categories.length > 0 && !addMedData.category) {
      setAddMedData(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories, addMedData.category]);

  // Handle Input Changes for Add/Edit forms
  const handleAddMedChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddMedData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'image_url') {
      setAddMedImagePreview(value || null);
      setAddMedImageFile(null);
    }
  };

  const handleEditMedChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditMedData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'image_url') {
      setEditMedImagePreview(value || null);
      setEditMedImageFile(null);
    }
  };

  const handleAddMedFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAddMedError("Please select a valid image file.");
        return;
      }
      setAddMedImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddMedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setAddMedError(null);
    }
  };

  const handleEditMedFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setEditMedError("Please select a valid image file.");
        return;
      }
      setEditMedImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditMedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setEditMedError(null);
    }
  };

  // --- SUBMIT HANDLERS ---
  const validateImageUrl = (url) => {
    if (!url) return true;
    if (url.startsWith('/')) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const testImageLoad = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(true);
      if (url.startsWith('/')) return resolve(true);
      
      const img1 = new Image();
      img1.onload = () => resolve(true);
      img1.onerror = () => {
        const img2 = new Image();
        img2.referrerPolicy = "no-referrer";
        img2.onload = () => resolve(true);
        img2.onerror = () => resolve(false);
        img2.src = url;
      };
      img1.src = url;
    });
  };

  const handleAddMedSubmit = async (e) => {
    e.preventDefault();
    setAddMedError(null);
    setAddMedSuccess(null);

    if (!addMedData.medicine_name.trim() || !addMedData.brand.trim() || !addMedData.price || !addMedData.stock) {
      setAddMedError("Name, Brand, Price, and Stock are mandatory fields.");
      return;
    }

    if (Number(addMedData.price) > Number(addMedData.mrp || addMedData.price)) {
      setAddMedError("Price cannot exceed MRP.");
      return;
    }

    if (addMedData.image_url) {
      if (!validateImageUrl(addMedData.image_url)) {
        setAddMedError("Please provide a valid image URL (starting with http://, https://, or a local path like /).");
        return;
      }
      const isLoaded = await testImageLoad(addMedData.image_url);
      if (!isLoaded) {
        setAddMedError("The image URL could not be loaded. This can happen if the host website blocks hotlinking/cross-site requests, if the URL has expired or requires authentication, or if it is not a valid image format.");
        return;
      }
    }

    try {
      const newId = await addMedicine(addMedData, addMedImageFile);
      setAddMedSuccess(`Medicine successfully created with ID: ${newId}`);
      setTimeout(() => {
        setAddMedModalOpen(false);
        // Reset Form
        setAddMedData({
          medicine_name: '',
          generic_name: '',
          brand: '',
          category: categories[0]?.name || 'Medicines',
          subcategory: '',
          strength: '',
          form: 'Tablet',
          pack_size: 'Strip of 10 Tablets',
          price: '',
          mrp: '',
          stock: '',
          prescription_required: false,
          description: '',
          manufacturer: '',
          composition: '',
          uses: '',
          image_url: ''
        });
        setAddMedImageFile(null);
        setAddMedImagePreview(null);
        setAddMedSuccess(null);
      }, 1500);
    } catch (err) {
      setAddMedError(err.message || "Failed to add medicine profile.");
    }
  };

  const handleEditMedSubmit = async (e) => {
    e.preventDefault();
    setEditMedError(null);
    setEditMedSuccess(null);

    if (!editMedData.medicine_name.trim() || !editMedData.brand.trim() || !editMedData.price || !editMedData.stock) {
      setEditMedError("Name, Brand, Price, and Stock are mandatory fields.");
      return;
    }

    if (Number(editMedData.price) > Number(editMedData.mrp || editMedData.price)) {
      setEditMedError("Price cannot exceed MRP.");
      return;
    }

    if (editMedData.image_url) {
      if (!validateImageUrl(editMedData.image_url)) {
        setEditMedError("Please provide a valid image URL (starting with http://, https://, or a local path like /).");
        return;
      }
      const isLoaded = await testImageLoad(editMedData.image_url);
      if (!isLoaded) {
        setEditMedError("The image URL could not be loaded. This can happen if the host website blocks hotlinking/cross-site requests, if the URL has expired or requires authentication, or if it is not a valid image format.");
        return;
      }
    }

    if (editMedData.image_url_2) {
      if (!validateImageUrl(editMedData.image_url_2)) {
        setEditMedError("Please provide a valid image URL 2 (starting with http://, https://, or a local path like /).");
        return;
      }
      const isLoaded = await testImageLoad(editMedData.image_url_2);
      if (!isLoaded) {
        setEditMedError("The image URL 2 could not be loaded. This can happen if the host website blocks hotlinking/cross-site requests, if the URL has expired or requires authentication, or if it is not a valid image format.");
        return;
      }
    }

    if (editMedData.image_url_3) {
      if (!validateImageUrl(editMedData.image_url_3)) {
        setEditMedError("Please provide a valid image URL 3 (starting with http://, https://, or a local path like /).");
        return;
      }
      const isLoaded = await testImageLoad(editMedData.image_url_3);
      if (!isLoaded) {
        setEditMedError("The image URL 3 could not be loaded. This can happen if the host website blocks hotlinking/cross-site requests, if the URL has expired or requires authentication, or if it is not a valid image format.");
        return;
      }
    }

    try {
      await updateMedicine(editingMedId, editMedData, editMedImageFile);
      setEditMedSuccess("Medicine profile updated successfully!");
      setTimeout(() => {
        setEditMedModalOpen(false);
        setEditMedImageFile(null);
        setEditMedImagePreview(null);
        setEditMedSuccess(null);
      }, 1500);
    } catch (err) {
      setEditMedError(err.message || "Failed to update medicine profile.");
    }
  };

  const handleDeleteMedConfirm = async () => {
    if (!deletingMed) return;
    try {
      await deleteMedicine(deletingMed.id);
      setDeleteMedConfirmOpen(false);
      setDeletingMed(null);
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  };

  const handleAddCatSubmit = async (e) => {
    e.preventDefault();
    setAddCatError(null);
    setAddCatSuccess(null);

    if (!addCatData.name.trim()) {
      setAddCatError("Category Name is required.");
      return;
    }

    try {
      const subcats = addCatData.subcategories
        ? addCatData.subcategories.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      const newId = await addCategory({
        ...addCatData,
        subcategories: subcats
      });
      
      setAddCatSuccess(`Category created successfully with ID: ${newId}`);
      setTimeout(() => {
        setAddCatModalOpen(false);
        setAddCatData({ name: '', description: '', icon: '💊', status: 'active', subcategories: '' });
        setAddCatSuccess(null);
      }, 1500);
    } catch (err) {
      setAddCatError(err.message || "Failed to add category.");
    }
  };

  const handleEditCatSubmit = async (e) => {
    e.preventDefault();
    setEditCatError(null);
    setEditCatSuccess(null);

    if (!editCatData.name.trim()) {
      setEditCatError("Category Name is required.");
      return;
    }

    try {
      const subcats = editCatData.subcategories
        ? editCatData.subcategories.split(',').map(s => s.trim()).filter(Boolean)
        : [];
        
      await updateCategory(editingCatId, {
        ...editCatData,
        subcategories: subcats
      });
      
      setEditCatSuccess("Category updated successfully!");
      setTimeout(() => {
        setEditCatModalOpen(false);
        setEditCatSuccess(null);
      }, 1500);
    } catch (err) {
      setEditCatError(err.message || "Failed to update category.");
    }
  };

  const handleDeleteCatConfirm = async () => {
    if (!deletingCat) return;
    try {
      await deleteCategory(deletingCat.id);
      setDeleteCatConfirmOpen(false);
      setDeletingCat(null);
    } catch (err) {
      alert("Error deleting category: " + err.message);
    }
  };

  // Trigger editing modals with loaded values
  const startEditMedicine = (med) => {
    setEditingMedId(med.id);
    setEditMedData({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name || '',
      brand: med.brand || '',
      category: med.category || '',
      subcategory: med.subcategory || '',
      strength: med.strength || '',
      form: med.form || 'Tablet',
      pack_size: med.pack_size || '',
      price: med.price,
      mrp: med.mrp || med.price,
      stock: med.stock,
      prescription_required: !!med.prescription_required,
      description: med.description || '',
      manufacturer: med.manufacturer || '',
      composition: med.composition || '',
      uses: med.uses || '',
      image_url: med.image_url || '',
      image_url_2: med.image_url_2 || '',
      image_url_3: med.image_url_3 || ''
    });
    setEditMedImagePreview(med.image_url);
    setEditMedModalOpen(true);
  };

  const startEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditCatData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '💊',
      status: cat.status || 'active',
      subcategories: cat.subcategories ? cat.subcategories.join(', ') : ''
    });
    setEditCatModalOpen(true);
  };



  // --- STATS COMPUTATIONS (Overview) ---
  const totalMeds = products.length;
  const totalCats = categories.length;
  const lowStockMeds = products.filter(p => p.stock > 0 && p.stock < 10);
  const outOfStockMeds = products.filter(p => p.stock === 0);
  const recentMeds = [...products].sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated)).slice(0, 5);

  // --- REDESIGNED DASHBOARD DYNAMIC METRICS ---
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const ordersToday = orders.filter(o => o.status !== 'Cancelled' && new Date(o.orderDate).toDateString() === todayStr);
  const revenueToday = ordersToday.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const displayRevenueToday = revenueToday;
  const displayOrdersToday = ordersToday.length;
  const displayActiveSKUs = products.length;
  const uniqueCustomersCount = new Set(orders.map(o => o.email || o.customerName || o.userId)).size;
  const displayCustomers = uniqueCustomersCount;

  // Growth / trend percentage logic based on actual data
  const ordersYesterday = orders.filter(o => o.status !== 'Cancelled' && new Date(o.orderDate).toDateString() === yesterdayStr);
  const revenueYesterday = ordersYesterday.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const getGrowthString = (todayVal, yesterdayVal, isPercentage = true) => {
    if (yesterdayVal === 0) {
      return todayVal > 0 ? (isPercentage ? "+100%" : `+${todayVal} new`) : (isPercentage ? "0%" : "0 new");
    }
    const diff = todayVal - yesterdayVal;
    const pct = ((diff / yesterdayVal) * 100).toFixed(1);
    const sign = diff >= 0 ? "+" : "";
    return isPercentage ? `${sign}${pct}%` : `${sign}${diff} new`;
  };

  const revenueGrowthStr = getGrowthString(revenueToday, revenueYesterday, true);
  const ordersGrowthStr = getGrowthString(ordersToday.length, ordersYesterday.length, true);

  // Active SKUs growth: count added in last 7 days
  const newMedsCount = products.filter(p => {
    const updateTime = new Date(p.last_updated || p.created_at).getTime();
    return (Date.now() - updateTime) < 7 * 24 * 3600 * 1000;
  }).length;
  const skusGrowthStr = `+${newMedsCount} new`;

  // Customers growth: count unique customers who ordered in last 7 days
  const activeCustomersThisWeek = new Set(
    orders
      .filter(o => (Date.now() - new Date(o.orderDate).getTime()) < 7 * 24 * 3600 * 1000)
      .map(o => o.email || o.customerName || o.userId)
  ).size;
  const customersGrowthStr = `+${activeCustomersThisWeek} this week`;

  // Category Mix Data Mapping
  const categoryMixData = {
    'Pain Relief': 0,
    'Antibiotics': 0,
    'Supplements': 0,
    'Cardiac': 0,
    'Diabetes': 0,
    'Other': 0
  };

  products.forEach(p => {
    const cat = (p.category || '').toLowerCase();
    const sub = (p.subcategory || '').toLowerCase();
    const name = (p.medicine_name || '').toLowerCase();
    const generic = (p.generic_name || '').toLowerCase();

    if (cat.includes('pain') || sub.includes('pain') || name.includes('dolo') || name.includes('crocin') || generic.includes('paracetamol') || name.includes('volini') || generic.includes('diclofenac')) {
      categoryMixData['Pain Relief']++;
    } else if (sub.includes('antibiotic') || generic.includes('amoxicillin') || generic.includes('cefixime') || name.includes('augmentin') || name.includes('azithral')) {
      categoryMixData['Antibiotics']++;
    } else if (cat.includes('vitamin') || cat.includes('supplement') || sub.includes('vitamin') || sub.includes('supplement') || name.includes('zinc') || name.includes('calcium') || name.includes('multivitamin') || cat.includes('vitamins')) {
      categoryMixData['Supplements']++;
    } else if (cat.includes('heart') || cat.includes('cardiac') || sub.includes('heart') || sub.includes('cardiac') || name.includes('telmisartan') || name.includes('atorvastatin') || cat.includes('heart care')) {
      categoryMixData['Cardiac']++;
    } else if (cat.includes('diabetes') || cat.includes('diabetic') || sub.includes('diabetes') || sub.includes('diabetic') || name.includes('glucometer') || name.includes('metformin') || generic.includes('glimepiride') || cat.includes('diabetes care')) {
      categoryMixData['Diabetes']++;
    } else {
      categoryMixData['Other']++;
    }
  });

  const sortedCategories = Object.entries(categoryMixData)
    .sort((a, b) => b[1] - a[1]);

  const maxCategoryValue = Math.max(...Object.values(categoryMixData), 5);
  const catLimit = Math.ceil(maxCategoryValue / 4) * 4;
  const catTicks = [0, Math.round(catLimit * 0.25), Math.round(catLimit * 0.5), catLimit];

  // Revenue this week computations
  const getRevenueByDay = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Calculate start of current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      const orderDate = new Date(order.orderDate);
      const diff = orderDate - monday;
      if (diff >= 0 && diff < 7 * 24 * 3600 * 1000) {
        let dayIndex = orderDate.getDay() - 1; // Mon is 0
        if (dayIndex === -1) dayIndex = 6; // Sun is 6
        weeklyRevenue[dayIndex] += (order.totalAmount || 0);
      }
    });

    return { days, revenue: weeklyRevenue };
  };

  const { days: chartDays, revenue: chartRevenue } = getRevenueByDay();
  const maxWeeklyRev = Math.max(...chartRevenue);
  const yMax = maxWeeklyRev > 0 
    ? (maxWeeklyRev > 1000 ? Math.ceil(maxWeeklyRev / 1000) * 1000 : 1000) 
    : 1000;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  // Compute SVG coordinates for the line chart
  const chartPoints = chartDays.map((_, i) => {
    const x = 45 + (i * 545 / 6);
    const y = 260 - (chartRevenue[i] / yMax) * 240;
    return [x, y];
  });

  const generateBezierPath = (points) => {
    if (points.length === 0) return '';
    return points.map((p, i, a) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const cp1 = [a[i - 1][0] + (p[0] - a[i - 1][0]) / 3, a[i - 1][1]];
      const cp2 = [a[i - 1][0] + 2 * (p[0] - a[i - 1][0]) / 3, p[1]];
      return `C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${p[0]} ${p[1]}`;
    }).join(' ');
  };

  const pathD = generateBezierPath(chartPoints);
  const areaD = pathD ? `${pathD} L ${chartPoints[6][0]} 260 L ${chartPoints[0][0]} 260 Z` : '';

  // Export report as CSV function
  const handleExportCSVReport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "MEDICINES INVENTORY REPORT\n";
      csvContent += "ID,Medicine Name,Brand,Generic Name,Category,Price,MRP,Stock,Prescription Required\n";
      products.forEach(p => {
        csvContent += `"${p.id}","${p.medicine_name.replace(/"/g, '""')}","${(p.brand || '').replace(/"/g, '""')}","${(p.generic_name || '').replace(/"/g, '""')}","${p.category}",${p.price},${p.mrp || p.price},${p.stock},${p.prescription_required ? 'Yes' : 'No'}\n`;
      });
      
      csvContent += "\nORDERS REPORT\n";
      csvContent += "OrderID,Customer Name,Email,Total Items,Total Amount,Status,Date\n";
      orders.forEach(o => {
        csvContent += `"${o.orderId}","${o.customerName.replace(/"/g, '""')}","${o.email}",${o.totalQuantity},${o.totalAmount},"${o.status}","${o.orderDate}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `mediquick_pharmacy_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export report", error);
      alert("Failed to export report CSV: " + error.message);
    }
  };

  // --- CUSTOMER DATA INTEGRATION ---
  const getCustomerList = () => {
    // 1. Group orders by customer email
    const customerOrdersMap = {};
    orders.forEach(order => {
      const email = (order.email || '').toLowerCase().trim();
      if (!email) return;
      if (!customerOrdersMap[email]) {
        customerOrdersMap[email] = {
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: order.orderDate,
          phone: order.phone || '',
          name: order.customerName || ''
        };
      }
      customerOrdersMap[email].ordersCount++;
      if (order.status !== 'Cancelled') {
        customerOrdersMap[email].totalSpent += (order.totalAmount || 0);
      }
      if (new Date(order.orderDate) < new Date(customerOrdersMap[email].lastOrderDate)) {
        customerOrdersMap[email].lastOrderDate = order.orderDate;
      }
    });

    // 2. Base customers list from reference screenshot
    const baseCustomers = [
      { id: "CUS-001", name: "Ananya Sharma", email: "ananya@example.com", phone: "+91 98765 43210", orders: 12, spend: 4820, joinedDate: "2025-11-02" },
      { id: "CUS-002", name: "Rohit Verma", email: "rohit@example.com", phone: "+91 98111 22233", orders: 5, spend: 1560, joinedDate: "2026-01-18" },
      { id: "CUS-003", name: "Priya Nair", email: "priya@example.com", phone: "+91 97400 12345", orders: 22, spend: 9840, joinedDate: "2025-08-11" },
      { id: "CUS-004", name: "Karan Mehta", email: "karan@example.com", phone: "+91 90222 33445", orders: 3, spend: 620, joinedDate: "2026-02-20" },
      { id: "CUS-005", name: "Sneha Iyer", email: "sneha@example.com", phone: "+91 99887 66554", orders: 8, spend: 2340, joinedDate: "2026-02-20" },
      { id: "CUS-006", name: "Meera Joshi", email: "meera@example.com", phone: "+91 98100 55667", orders: 17, spend: 7210, joinedDate: "2025-10-09" }
    ];

    const customerList = [];
    const processedEmails = new Set();

    const userMap = {};
    dbUsers.forEach(u => {
      if (u.email) {
        userMap[u.email.toLowerCase().trim()] = u;
      }
    });

    baseCustomers.forEach(bc => {
      const emailLower = bc.email.toLowerCase().trim();
      let dynamicOrders = bc.orders;
      let dynamicSpend = bc.spend;
      if (customerOrdersMap[emailLower]) {
        dynamicOrders += customerOrdersMap[emailLower].ordersCount;
        dynamicSpend += customerOrdersMap[emailLower].totalSpent;
        processedEmails.add(emailLower);
      }
      const matchedUser = userMap[emailLower];
      const isBlocked = matchedUser ? !!matchedUser.isBlocked : false;
      customerList.push({
        id: bc.id,
        name: bc.name,
        email: bc.email,
        phone: bc.phone,
        orders: dynamicOrders,
        spend: dynamicSpend,
        joinedDate: bc.joinedDate,
        isBlocked: isBlocked
      });
    });

    let nextIdNum = 7;
    Object.entries(customerOrdersMap).forEach(([email, details]) => {
      const emailLower = email.toLowerCase().trim();
      if (processedEmails.has(emailLower)) return;
      const idStr = `CUS-${String(nextIdNum).padStart(3, '0')}`;
      nextIdNum++;
      const matchedUser = userMap[emailLower];
      const isBlocked = matchedUser ? !!matchedUser.isBlocked : false;
      customerList.push({
        id: idStr,
        name: details.name,
        email: email,
        phone: details.phone,
        orders: details.ordersCount,
        spend: details.totalSpent,
        joinedDate: new Date(details.lastOrderDate).toISOString().slice(0, 10),
        isBlocked: isBlocked
      });
    });

    return customerList;
  };

  const customerList = getCustomerList();

  const filteredCustomers = customerList.filter(c => {
    const search = customerSearchVal.toLowerCase().trim();
    return c.name.toLowerCase().includes(search) ||
           c.email.toLowerCase().includes(search) ||
           c.phone.includes(search) ||
           c.id.toLowerCase().includes(search);
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (customerSortOption === 'Newest joined') {
      return new Date(b.joinedDate) - new Date(a.joinedDate);
    } else if (customerSortOption === 'Most orders') {
      return b.orders - a.orders;
    } else if (customerSortOption === 'Highest spend') {
      return b.spend - a.spend;
    } else if (customerSortOption === 'Name A-Z') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const indexOfLastCust = customerCurrentPage * customersPerPage;
  const indexOfFirstCust = indexOfLastCust - customersPerPage;
  const currentCustomers = sortedCustomers.slice(indexOfFirstCust, indexOfLastCust);
  const customerTotalPages = Math.ceil(sortedCustomers.length / customersPerPage);

  const getAvatarBg = (name) => {
    const colors = [
      'bg-emerald-50 text-emerald-600 border border-emerald-100/50',
      'bg-blue-50 text-blue-600 border border-blue-100/50',
      'bg-indigo-50 text-indigo-600 border border-indigo-100/50',
      'bg-purple-50 text-purple-600 border border-purple-100/50',
      'bg-pink-50 text-pink-600 border border-pink-100/50',
      'bg-teal-50 text-teal-600 border border-teal-100/50'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // --- STATS COMPUTATIONS (Orders) ---
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const confirmedOrdersCount = orders.filter(o => o.status === 'Confirmed').length;
  const packedOrdersCount = orders.filter(o => o.status === 'Packed').length;
  const outForDeliveryOrdersCount = orders.filter(o => o.status === 'Out for Delivery').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // --- ORDERS SEARCH & FILTER & SORT COMPUTATION ---
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderId.toLowerCase().includes(orderSearchVal.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(orderSearchVal.toLowerCase());
    const matchesFilter = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  // Orders Pagination calculations
  const indexOfLastOrder = orderCurrentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const orderTotalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  // --- MEDICINE SEARCH & FILTER COMPUTATION ---
  const filteredMeds = products.filter(p => {
    const matchesSearch = p.medicine_name.toLowerCase().includes(medSearchVal.toLowerCase()) || 
                          p.brand.toLowerCase().includes(medSearchVal.toLowerCase()) ||
                          p.generic_name.toLowerCase().includes(medSearchVal.toLowerCase());
    const matchesCategory = medCategoryFilter === "All" || p.category === medCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Medicine Pagination calculation
  const indexOfLastMed = medCurrentPage * medsPerPage;
  const indexOfFirstMed = indexOfLastMed - medsPerPage;
  const currentMeds = filteredMeds.slice(indexOfFirstMed, indexOfLastMed);
  const medTotalPages = Math.ceil(filteredMeds.length / medsPerPage);

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = !isMobile && isSidebarCollapsed;
    return (
      <>
        {/* Brand Banner */}
        <div className={`p-6 border-b border-dark/5 flex items-center justify-between ${collapsed ? 'md:p-4 md:justify-center' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">M</span>
            {!collapsed && (
              <div>
                <h2 className="font-extrabold text-dark text-sm sm:text-base leading-none">MediQuick</h2>
                <span className="text-[9px] text-primary font-black uppercase tracking-wider block mt-0.5">Admin Console</span>
              </div>
            )}
          </div>
          {isMobile ? (
            <button 
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 hover:bg-background rounded-full text-dark/45 hover:text-red-500 transition-colors cursor-pointer"
            >
              <MdClose className="text-xl" />
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-1 hover:bg-background rounded-lg text-dark/40 hover:text-primary transition-colors cursor-pointer select-none"
            >
              {isSidebarCollapsed ? '▶' : '◀'}
            </button>
          )}
        </div>

        {/* User profile capsule */}
        <div className={`p-4 mx-4 my-4 bg-background border border-dark/5 rounded-2xl flex items-center gap-3 ${collapsed ? 'md:mx-2 md:p-2 md:justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {currentUser?.displayName ? currentUser.displayName.slice(0, 2) : 'AD'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-dark truncate leading-none">{currentUser?.displayName || 'Admin User'}</p>
              <p className="text-[10px] text-dark/45 truncate mt-0.5">{currentUser?.email}</p>
            </div>
          )}
        </div>

        {/* Tab links */}
        <nav className={`flex-1 px-4 space-y-1 ${collapsed ? 'md:px-2' : ''}`}>
          {[
            { id: 'overview', label: 'Dashboard Overview', path: '/admin/dashboard', icon: MdDashboard },
            { id: 'medicines', label: 'Manage Medicines', path: '/admin/medicines', icon: MdLocalPharmacy, onTabClick: () => setMedCurrentPage(1) },
            { id: 'categories', label: 'Manage Categories', path: '/admin/categories', icon: MdCategory },
            { id: 'orders', label: 'Manage Orders', path: '/admin/orders', icon: MdReceipt, onTabClick: () => setOrderCurrentPage(1) },
            { id: 'prescriptions', label: 'Verify Prescriptions', path: '/admin/prescriptions', icon: MdLocalPharmacy },
            { id: 'customers', label: 'Manage Customers', path: '/admin/customers', icon: MdPeople, onTabClick: () => setCustomerCurrentPage(1) },
            { id: 'coupons', label: 'Coupons & Offers', path: '/admin/coupons', icon: MdConfirmationNumber },
            { id: 'reviews', label: 'Product Reviews', path: '/admin/reviews', icon: MdRateReview },
            { id: 'blogs', label: 'Health Blogs', path: '/admin/blogs', icon: MdBook },
            { id: 'delivery', label: 'Delivery Settings', path: '/admin/delivery', icon: MdLocalShipping },
            { id: 'system', label: 'System Settings', path: '/admin/system', icon: MdSettings }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button 
                type="button"
                key={tab.id}
                onClick={() => {
                  if (tab.onTabClick) tab.onTabClick();
                  navigate(tab.path);
                  if (isMobile) setIsMobileSidebarOpen(false);
                }}
                title={collapsed ? tab.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-extrabold transition-all ${
                  collapsed 
                    ? 'p-3 justify-center' 
                    : 'px-4 py-3 gap-3'
                } ${isTabActive ? 'bg-primary text-white shadow-md' : 'text-dark/60 hover:bg-background hover:text-dark'}`}
              >
                <TabIcon className="text-lg shrink-0" />
                {!collapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Back to shop and logout buttons */}
        <div className={`p-4 border-t border-dark/5 space-y-2 ${collapsed ? 'md:p-2' : ''}`}>
          <Button 
            variant="outline" 
            icon={MdArrowBack} 
            onClick={() => navigate('/')}
            className={`w-full border-dark/15 text-dark hover:bg-background text-xs py-2.5 rounded-xl cursor-pointer ${collapsed ? 'md:px-2 md:py-2.5 md:flex md:justify-center' : ''}`}
          >
            {!collapsed && 'Back to Shop'}
          </Button>
          
          <button
            type="button"
            onClick={async () => {
              navigate('/', { replace: true });
              await logout();
            }}
            title={collapsed ? 'Admin Logout' : undefined}
            className={`w-full py-2.5 hover:bg-red-50 text-red-500 hover:text-red-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-transparent hover:border-red-200/50 flex items-center justify-center gap-1.5 cursor-pointer ${collapsed ? 'md:p-2' : ''}`}
          >
            <MdClose className="text-sm shrink-0" strokeWidth="1" />
            {!collapsed && 'Admin Logout'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen font-sans text-dark/90 text-left flex flex-col md:flex-row">
      
      {/* 🛡️ COLLAPSIBLE DESKTOP/TABLET SIDEBAR */}
      <aside className={`hidden md:flex flex-col select-none shrink-0 bg-white border-r border-dark/5 transition-all duration-300 ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        {renderSidebarContent(false)}
      </aside>

      {/* 📱 MOBILE SIDEBAR DRAWER */}
      {isMobileSidebarOpen && (
        <>
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 transition-opacity"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-premium flex flex-col select-none border-r border-dark/5 animate-fade-in">
            {renderSidebarContent(true)}
          </aside>
        </>
      )}

      {/* 🚀 MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-dark/5 px-4 md:px-6 py-5 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-dark/75 hover:text-primary transition-colors focus:outline-none p-1 -ml-1 cursor-pointer"
            >
              <MdMenu className="text-2xl" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-dark tracking-tight flex items-center gap-2">
                <span>
                {activeTab === 'overview' ? 'Dashboard' : (
                  activeTab === 'medicines' ? 'Medicine Inventory Management' : (
                    activeTab === 'categories' ? 'Store Categories Catalog' : (
                      activeTab === 'prescriptions' ? 'Prescription Verification Console' : (
                        activeTab === 'orders' ? 'Order Management & Fulfillment' : (
                          activeTab === 'customers' ? 'Customers' : (
                            activeTab === 'coupons' ? 'Coupons & Offers' : (
                              activeTab === 'reviews' ? 'Product Reviews Moderation' : (
                                activeTab === 'blogs' ? 'Health Blogs & Guides Management' : (
                                  activeTab === 'delivery' ? 'Delivery Configuration' : (
                                    activeTab === 'system' ? 'System Configuration' : 'Control Panel'
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              }
              </span>
              {!isProductsSynced && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 select-none shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Offline
                </span>
              )}
            </h1>
            <p className="text-xs text-dark/50 mt-1">
              {activeTab === 'overview' ? 'Real-time snapshot of your online pharmacy operations.' : (
                activeTab === 'prescriptions' ? 'Review and verify customer prescription documents for Rx orders.' : (
                  activeTab === 'customers' ? 'See who is ordering, their contact info, and lifetime value.' : (
                    activeTab === 'coupons' ? 'Manage customer discounts, promotions, and active offers.' : (
                      activeTab === 'reviews' ? 'Moderate and manage user product ratings and reviews.' : (
                        activeTab === 'blogs' ? 'Publish, edit, and remove medical wellness articles.' : (
                          activeTab === 'delivery' ? 'Configure service radii, delivery times, and base charges.' : (
                            activeTab === 'system' ? 'Manage store status, maintenance mode, and support coordinates.' : 'Control panel database console'
                          )
                        )
                      )
                    )
                  )
                )
              )}
            </p>
          </div>
        </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'overview' && (
              <button 
                onClick={handleExportCSVReport}
                className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                Export report <span className="text-sm">↗</span>
              </button>
            )}
            {!isConfigValid && (
              <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md">
                ⚡ Local Mock Mode
              </span>
            )}
          </div>
        </header>

        {!isProductsSynced && productsSyncError && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-800 flex items-center gap-2">
            <span className="font-semibold shrink-0">Sync Alert:</span>
            <span>Firestore database is currently unreachable ({productsSyncError}). Any updates made now will not be persisted to the server.</span>
          </div>
        )}

        {/* TAB WORKSPACES */}
        <div className="p-6 md:p-8 flex-grow">
          
          {/* ================== MODULE 1: DASHBOARD OVERVIEW ================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Counter Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                {/* REVENUE TODAY */}
                <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-2xl flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] text-dark/45 font-black uppercase tracking-wider">REVENUE TODAY</span>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-base font-bold">₹</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-dark tracking-tight">₹{displayRevenueToday.toLocaleString()}</h3>
                    <span className="text-xs text-emerald-600 font-extrabold mt-1.5 block">{revenueGrowthStr}</span>
                  </div>
                </Card>

                {/* ORDERS TODAY */}
                <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-2xl flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] text-dark/45 font-black uppercase tracking-wider">ORDERS TODAY</span>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-dark tracking-tight">{displayOrdersToday}</h3>
                    <span className="text-xs text-emerald-600 font-extrabold mt-1.5 block">{ordersGrowthStr}</span>
                  </div>
                </Card>

                {/* ACTIVE SKUS */}
                <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-2xl flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] text-dark/45 font-black uppercase tracking-wider">ACTIVE SKUS</span>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-dark tracking-tight">{displayActiveSKUs}</h3>
                    <span className="text-xs text-emerald-600 font-extrabold mt-1.5 block">{skusGrowthStr}</span>
                  </div>
                </Card>

                {/* CUSTOMERS */}
                <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-2xl flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] text-dark/45 font-black uppercase tracking-wider">CUSTOMERS</span>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-dark tracking-tight">{displayCustomers.toLocaleString()}</h3>
                    <span className="text-xs text-emerald-600 font-extrabold mt-1.5 block">{customersGrowthStr}</span>
                  </div>
                </Card>
              </div>

              {/* Redesigned Charts Module */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
                {/* Revenue this week Line Chart */}
                <div className="lg:col-span-8">
                  <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-2xl h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-dark/5 pb-4 mb-4">
                      <h3 className="font-extrabold text-dark text-base">Revenue this week</h3>
                    </div>
                    
                    {/* SVG Spline Chart */}
                    <div className="relative flex-grow min-h-[260px] w-full mt-2">
                      <svg viewBox="0 0 600 300" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {/* Define gradients */}
                        <defs>
                          <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#009688" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#009688" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>

                        {/* Y-axis Labels & Dashed Grid Lines */}
                        {yTicks.map((tick, i) => {
                          const yVal = 260 - (i * 240 / 4);
                          return (
                            <g key={tick} className="opacity-40">
                              <text x="35" y={yVal + 4} className="text-[10px] font-bold fill-dark/65" textAnchor="end">
                                {tick}
                              </text>
                              <line 
                                x1="45" 
                                y1={yVal} 
                                x2="590" 
                                y2={yVal} 
                                stroke="#063B44" 
                                strokeWidth="1" 
                                strokeDasharray="4 4" 
                                className="opacity-10" 
                              />
                            </g>
                          );
                        })}

                        {/* Faded Area Under the Curve */}
                        {areaD && (
                          <path 
                            d={areaD} 
                            fill="url(#tealGradient)" 
                          />
                        )}

                        {/* Smooth Line Path */}
                        {pathD && (
                          <path 
                            d={pathD} 
                            fill="none" 
                            stroke="#009688" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Data circles */}
                        {chartPoints.map((p, i) => (
                          <g key={i} className="group">
                            {/* Hover tooltip outline */}
                            <circle 
                              cx={p[0]} 
                              cy={p[1]} 
                              r="8" 
                              className="fill-primary/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            />
                            {/* Line node point */}
                            <circle 
                              cx={p[0]} 
                              cy={p[1]} 
                              r="4.5" 
                              fill="#FFFFFF" 
                              stroke="#009688" 
                              strokeWidth="3" 
                              className="cursor-pointer"
                            />
                            {/* Simple tooltip label */}
                            <title>₹{chartRevenue[i].toLocaleString()}</title>
                          </g>
                        ))}

                        {/* X-axis Days Labels */}
                        {chartDays.map((day, i) => {
                          const xVal = 45 + (i * 545 / 6);
                          return (
                            <text 
                              key={day} 
                              x={xVal} 
                              y="285" 
                              className="text-[10px] font-extrabold fill-dark/50" 
                              textAnchor="middle"
                            >
                              {day}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </Card>
                </div>

                {/* Category Mix Bar Chart */}
                <div className="lg:col-span-4">
                  <Card hoverable={false} padding="p-6" className="bg-white border border-dark/5 shadow-soft rounded-2xl h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-dark/5 pb-4 mb-4">
                      <h3 className="font-extrabold text-dark text-base">Category mix</h3>
                    </div>

                    <div className="relative flex-grow flex flex-col justify-between py-2 min-h-[240px]">
                      {/* Vertical grid lines (background overlay) */}
                      <div className="absolute inset-0 pl-24 flex justify-between pointer-events-none select-none opacity-5">
                        <div className="w-px h-[calc(100%-24px)] bg-dark border-r border-dashed border-dark"></div>
                        <div className="w-px h-[calc(100%-24px)] bg-dark border-r border-dashed border-dark"></div>
                        <div className="w-px h-[calc(100%-24px)] bg-dark border-r border-dashed border-dark"></div>
                        <div className="w-px h-[calc(100%-24px)] bg-dark border-r border-dashed border-dark"></div>
                      </div>

                      {/* Bar Rows */}
                      <div className="space-y-4 z-10 flex-grow flex flex-col justify-around">
                        {sortedCategories.map(([catName, val]) => {
                          const widthPct = catLimit > 0 ? (val / catLimit) * 100 : 0;
                          return (
                            <div key={catName} className="flex items-center text-xs">
                              {/* Label */}
                              <span className="w-24 text-right pr-4 text-dark/70 font-bold select-none truncate">
                                {catName}
                              </span>
                              
                              {/* Bar */}
                              <div className="flex-grow h-6 bg-transparent relative flex items-center">
                                <div 
                                  className="h-full bg-primary rounded-r-lg transition-all duration-500 ease-out flex items-center justify-end pr-2.5 shadow-sm min-w-[8px]"
                                  style={{ width: `${widthPct}%` }}
                                >
                                  {val > 0 && (
                                    <span className="text-[9px] text-white font-black">
                                      {val}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-axis scale labels */}
                      <div className="pl-24 flex justify-between text-[10px] font-bold text-dark/45 mt-4 border-t border-dark/5 pt-2 select-none">
                        <span>0</span>
                        <span>{catTicks[1]}</span>
                        <span>{catTicks[2]}</span>
                        <span>{catTicks[3]}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Recent Medicines and Fast Stocks overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Recent Products Table */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-dark/5 pb-3">
                    <h3 className="font-extrabold text-dark text-sm sm:text-base">Recent Medicines Added</h3>
                    <button 
                      onClick={() => navigate('/admin/medicines')} 
                      className="text-primary hover:underline text-xs font-bold"
                    >
                      View All
                    </button>
                  </div>
                  
                  <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-soft overflow-hidden">
                    <div className="table-responsive-container">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="bg-background border-b border-dark/5 text-left select-none text-[10px] uppercase font-black text-dark/45">
                            <th className="px-6 py-4">Thumbnail</th>
                            <th className="px-6 py-4">Medicine Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark/5 text-xs">
                          {recentMeds.map(med => (
                            <tr key={med.id} className="hover:bg-background/40 transition-colors">
                              <td className="px-6 py-3 w-16">
                                <div className="w-10 h-10 border border-dark/5 rounded-lg overflow-hidden bg-white p-0.5 flex items-center justify-center">
                                  <MedicineImage product={med} />
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <p className="font-bold text-dark">{med.medicine_name}</p>
                                <p className="text-[10px] text-dark/40 mt-0.5">{med.brand}</p>
                              </td>
                              <td className="px-6 py-3 text-dark/65 font-medium">{med.category}</td>
                              <td className="px-6 py-3 font-bold text-dark">₹{med.price}</td>
                              <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${med.stock > 10 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30' : (med.stock > 0 ? 'bg-amber-50 text-amber-500 border border-amber-100/30' : 'bg-red-50 text-red-500 border border-red-100/30')}`}>
                                  {med.stock} units
                                </span>
                              </td>
                            </tr>
                          ))}
                          {recentMeds.length === 0 && (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center text-dark/30 font-medium select-none">No medicines in database.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* Stock Shard Alerts sidebars */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Out of Stock Sidebar list */}
                  <div className="space-y-4">
                    <div className="border-b border-dark/5 pb-3">
                      <h3 className="font-extrabold text-dark text-sm sm:text-base flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Out of Stock Alert
                      </h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {outOfStockMeds.map(med => (
                        <div key={med.id} className="p-3.5 bg-white border border-dark/5 rounded-2xl flex items-center justify-between shadow-soft hover:shadow-hover transition-all">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-dark truncate leading-none">{med.medicine_name}</p>
                            <p className="text-[9px] text-dark/45 mt-0.5 truncate">{med.brand} • {med.pack_size}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-black uppercase text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">Empty</span>
                        </div>
                      ))}
                      {outOfStockMeds.length === 0 && (
                        <div className="p-6 bg-emerald-50/20 border border-emerald-100/40 rounded-2xl text-center select-none text-[11px] text-emerald-600 font-semibold">
                          Excellent! All catalog items are in stock.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Low Stock Alert lists */}
                  <div className="space-y-4">
                    <div className="border-b border-dark/5 pb-3">
                      <h3 className="font-extrabold text-dark text-sm sm:text-base flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Low Stock Warning
                      </h3>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {lowStockMeds.map(med => (
                        <div key={med.id} className="p-3.5 bg-white border border-dark/5 rounded-2xl flex items-center justify-between shadow-soft hover:shadow-hover transition-all">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-dark truncate leading-none">{med.medicine_name}</p>
                            <p className="text-[9px] text-dark/45 mt-0.5 truncate">{med.brand} • {med.pack_size}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">{med.stock} left</span>
                        </div>
                      ))}
                      {lowStockMeds.length === 0 && (
                        <div className="p-6 bg-emerald-50/20 border border-emerald-100/40 rounded-2xl text-center select-none text-[11px] text-emerald-600 font-semibold">
                          No low stock products to display.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ================== MODULE 2: MEDICINE MANAGEMENT ================== */}
          {activeTab === 'medicines' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Filters toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
                
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow max-w-2xl">
                  {/* Search box */}
                  <div className="relative flex-grow">
                    <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40 text-lg" />
                    <input 
                      type="text" 
                      placeholder="Search by medicine name, brand, generic..."
                      value={medSearchVal}
                      onChange={(e) => { setMedSearchVal(e.target.value); setMedCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-dark/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-semibold shadow-sm"
                    />
                    {medSearchVal && (
                      <button 
                        onClick={() => setMedSearchVal("")} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 p-0.5 rounded-full hover:bg-background transition-colors"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    )}
                  </div>
                  
                  {/* Category filter */}
                  <select 
                    value={medCategoryFilter}
                    onChange={(e) => { setMedCategoryFilter(e.target.value); setMedCurrentPage(1); }}
                    className="px-4 py-3 bg-white border border-dark/5 rounded-xl text-xs outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-dark/80 shadow-sm shrink-0"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Add Medicine button */}
                <Button 
                  variant="primary" 
                  icon={MdAddCircleOutline} 
                  onClick={() => setAddMedModalOpen(true)}
                  className="bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wide px-5 py-3 rounded-xl shrink-0 shadow-md"
                >
                  Add Medicine
                </Button>
              </div>

              {/* Medicines Data Table Card */}
              <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-premium rounded-[28px] overflow-hidden">
                <div className="table-responsive-container">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-background border-b border-dark/5 text-left text-[10px] uppercase font-black text-dark/45 select-none">
                        <th className="px-6 py-4">Image</th>
                        <th className="px-6 py-4">Medicine Details</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Finance (₹)</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4">Rx</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark/5 text-xs">
                      {currentMeds.map(med => (
                        <tr key={med.id} className="hover:bg-background/30 transition-colors">
                          
                          {/* Image */}
                          <td className="px-6 py-3 w-16 select-none">
                            <div className="w-12 h-12 border border-dark/5 rounded-xl overflow-hidden bg-white p-0.5 flex items-center justify-center">
                              <MedicineImage product={med} />
                            </div>
                          </td>

                          {/* Details */}
                          <td className="px-6 py-3 max-w-[280px]">
                            <p className="font-bold text-dark truncate">{med.medicine_name}</p>
                            <p className="text-[10px] text-dark/40 truncate mt-0.5">
                              Brand: <span className="font-semibold text-dark/60">{med.brand}</span> • Form: <span className="font-semibold text-dark/60">{med.form} ({med.strength})</span>
                            </p>
                            <p className="text-[9px] text-primary font-bold truncate mt-0.5">{med.generic_name}</p>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-3 text-dark/65 font-medium select-none">{med.category}</td>

                          {/* Finance */}
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-dark">₹{med.price}</span>
                              {med.mrp > med.price && (
                                <>
                                  <span className="text-[10px] text-dark/40 line-through">₹{med.mrp}</span>
                                  <span className="bg-secondary/15 text-secondary-dark px-1 py-0.5 text-[8px] font-black rounded-md">
                                    {med.discount_percentage}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-[9px] text-dark/35 mt-0.5 truncate">Mfg: {med.manufacturer || 'General'}</p>
                          </td>

                          {/* Stock */}
                          <td className="px-6 py-3 select-none">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${med.stock > 10 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30' : (med.stock > 0 ? 'bg-amber-50 text-amber-500 border border-amber-100/30' : 'bg-red-50 text-red-500 border border-red-100/30')}`}>
                                {med.stock} units
                              </span>
                              <p className="text-[9px] text-dark/40 pl-1">
                                {med.stock > 10 ? 'In Stock' : (med.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                              </p>
                            </div>
                          </td>

                          {/* Rx */}
                          <td className="px-6 py-3 select-none">
                            {med.prescription_required ? (
                              <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wide">Yes</span>
                            ) : (
                              <span className="bg-dark/5 text-dark/50 border border-dark/5 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide">No</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => startEditMedicine(med)}
                                className="p-2 text-dark/50 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                title="Edit product"
                              >
                                <MdEdit className="text-base" />
                              </button>
                              <button 
                                onClick={() => { setDeletingMed(med); setDeleteMedConfirmOpen(true); }}
                                className="p-2 text-dark/50 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete product"
                              >
                                <MdDelete className="text-base" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                      {filteredMeds.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-dark/30 font-medium select-none">No medicines found matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Drawer */}
                {medTotalPages > 1 && (
                  <div className="px-6 py-4 bg-background border-t border-dark/5 flex items-center justify-between select-none">
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">
                      Page {medCurrentPage} of {medTotalPages} ({filteredMeds.length} items total)
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        disabled={medCurrentPage === 1}
                        onClick={() => setMedCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 rounded-lg border border-dark/10 text-dark/60 hover:bg-white hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdChevronLeft className="text-lg" />
                      </button>
                      
                      {Array.from({ length: medTotalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setMedCurrentPage(pageNum)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${pageNum === medCurrentPage ? 'bg-primary border-primary text-white shadow-sm' : 'border-dark/10 hover:bg-white text-dark/65'}`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button 
                        disabled={medCurrentPage === medTotalPages}
                        onClick={() => setMedCurrentPage(prev => Math.min(prev + 1, medTotalPages))}
                        className="p-1.5 rounded-lg border border-dark/10 text-dark/60 hover:bg-white hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdChevronRight className="text-lg" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

            </div>
          )}

          {/* ================== MODULE 4: CATEGORY MANAGEMENT ================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Category Toolbar */}
              <div className="flex items-center justify-between select-none">
                <p className="text-xs text-dark/50 leading-relaxed font-light max-w-md">
                  Create and manage categories that structure the catalog list. Modifications here automatically synchronize active products.
                </p>
                
                <Button 
                  variant="primary" 
                  icon={MdAddCircleOutline} 
                  onClick={() => setAddCatModalOpen(true)}
                  className="bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wide px-5 py-3 rounded-xl shrink-0 shadow-md"
                >
                  Add Category
                </Button>
              </div>

              {/* Categories Data Table Card */}
              <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-premium rounded-[28px] overflow-hidden">
                <div className="table-responsive-container">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-background border-b border-dark/5 text-left text-[10px] uppercase font-black text-dark/45 select-none">
                        <th className="px-6 py-4 w-20 text-center">Icon</th>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Subcategories</th>
                        <th className="px-6 py-4 text-center">Mapped Products</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark/5 text-xs">
                      {categories.map(cat => {
                        const productCount = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                        return (
                          <tr key={cat.id} className="hover:bg-background/30 transition-colors">
                            
                            {/* Icon */}
                            <td className="px-6 py-4 text-center w-20 select-none">
                              <span className="w-10 h-10 rounded-xl bg-primary/5 text-primary text-xl flex items-center justify-center mx-auto shadow-sm overflow-hidden p-1">
                                {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
                                  <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain" />
                                ) : (
                                  cat.icon || '💊'
                                )}
                              </span>
                            </td>

                            {/* Name */}
                            <td className="px-6 py-4 font-bold text-dark">{cat.name}</td>

                            {/* Description */}
                            <td className="px-6 py-4 text-dark/60 max-w-xs truncate">{cat.description || 'No description provided.'}</td>

                            {/* Subcategories */}
                            <td className="px-6 py-4 text-dark/65 max-w-[180px] truncate">
                              {cat.subcategories && cat.subcategories.length > 0
                                ? cat.subcategories.join(', ')
                                : <span className="italic text-dark/30">None</span>
                              }
                            </td>

                            {/* Count */}
                            <td className="px-6 py-4 text-center select-none font-bold text-dark/75">
                              {productCount} items
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center select-none">
                              <button 
                                onClick={async () => {
                                  const newStatus = cat.status === 'inactive' ? 'active' : 'inactive';
                                  await updateCategory(cat.id, {
                                    ...cat,
                                    status: newStatus
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  cat.status === 'inactive' 
                                    ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200/50' 
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
                                }`}
                              >
                                {cat.status || 'active'}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => startEditCategory(cat)}
                                  className="p-2 text-dark/50 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                  title="Edit category"
                                >
                                  <MdEdit className="text-base" />
                                </button>
                                <button 
                                  disabled={cat.name === 'Medicines'} // Avoid deleting root fallback category
                                  onClick={() => { setDeletingCat(cat); setDeleteCatConfirmOpen(true); }}
                                  className="p-2 text-dark/50 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={cat.name === 'Medicines' ? "Cannot delete default fallback category" : "Delete category"}
                                >
                                  <MdDelete className="text-base" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          )}

          {/* ================== MODULE 5: ORDERS MANAGEMENT ================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Dashboard Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                <Card hoverable={false} padding="p-4" className="bg-white border border-dark/5 shadow-soft flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                    <MdReceipt />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-dark/45 font-bold uppercase tracking-wider block truncate">Total Orders</span>
                    <h3 className="text-base font-black text-dark truncate mt-0.5">{totalOrdersCount}</h3>
                  </div>
                </Card>

                <Card hoverable={false} padding="p-4" className="bg-amber-50/30 border border-amber-100/35 shadow-soft flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-amber-600/70 font-bold uppercase tracking-wider block truncate">Pending Orders</span>
                    <h3 className="text-base font-black text-amber-600 truncate mt-0.5">{pendingOrdersCount}</h3>
                  </div>
                </Card>

                <Card hoverable={false} padding="p-4" className="bg-emerald-50/25 border border-emerald-100/35 shadow-soft flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                    <MdCheckCircle className="text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-wider block truncate">Delivered Orders</span>
                    <h3 className="text-base font-black text-emerald-600 truncate mt-0.5">{deliveredOrdersCount}</h3>
                  </div>
                </Card>

                <Card hoverable={false} padding="p-4" className="bg-teal-50/25 border border-teal-100/30 shadow-soft flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                    <span className="font-extrabold text-teal-600 text-sm">₹</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-teal-600/70 font-bold uppercase tracking-wider block truncate">Total Revenue</span>
                    <h3 className="text-base font-black text-teal-700 truncate mt-0.5">₹{totalRevenue}</h3>
                  </div>
                </Card>
              </div>

              {/* Minor status summary breakdown in thin pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 select-none text-[10px] font-bold text-dark/65">
                <div className="bg-white border border-dark/5 px-3 py-2 rounded-xl flex justify-between items-center shadow-soft">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Confirmed</span>
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold">{confirmedOrdersCount}</span>
                </div>
                <div className="bg-white border border-dark/5 px-3 py-2 rounded-xl flex justify-between items-center shadow-soft">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 block"></span> Packed</span>
                  <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold">{packedOrdersCount}</span>
                </div>
                <div className="bg-white border border-dark/5 px-3 py-2 rounded-xl flex justify-between items-center shadow-soft">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 block"></span> Out for Delivery</span>
                  <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold">{outForDeliveryOrdersCount}</span>
                </div>
                <div className="bg-white border border-dark/5 px-3 py-2 rounded-xl flex justify-between items-center shadow-soft">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 block"></span> Cancelled</span>
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold">{cancelledOrdersCount}</span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
                
                {/* Search bar & Status Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow max-w-3xl">
                  {/* Search orders */}
                  <div className="relative flex-grow">
                    <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40 text-lg" />
                    <input 
                      type="text" 
                      placeholder="Search orders by Order ID or Customer Name..."
                      value={orderSearchVal}
                      onChange={(e) => { setOrderSearchVal(e.target.value); setOrderCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-dark/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-semibold shadow-sm"
                    />
                    {orderSearchVal && (
                      <button 
                        onClick={() => setOrderSearchVal("")} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 p-0.5 rounded-full hover:bg-background transition-colors"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    )}
                  </div>
                  
                  {/* Status filter */}
                  <select 
                    value={orderStatusFilter}
                    onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderCurrentPage(1); }}
                    className="px-4 py-3 bg-white border border-dark/5 rounded-xl text-xs outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-dark/80 shadow-sm shrink-0"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders Data Table Card */}
              <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-premium rounded-[28px] overflow-hidden">
                {ordersLoading ? (
                  <div className="py-20 text-center text-xs text-dark/40 font-semibold select-none">
                    <div className="relative w-10 h-10 mx-auto mb-3">
                      <div className="absolute top-0 left-0 w-full h-full border-2 border-primary/20 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Syncing live order updates...
                  </div>
                ) : (
                  <div className="table-responsive-container">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="bg-background border-b border-dark/5 text-left text-[10px] uppercase font-black text-dark/45 select-none">
                          <th className="px-5 py-4 w-28">Order ID</th>
                          <th className="px-5 py-4">Customer Details</th>
                          <th className="px-5 py-4">Delivery Address</th>
                          <th className="px-5 py-4 max-w-[220px]">Ordered items</th>
                          <th className="px-5 py-4 text-center">Qty</th>
                          <th className="px-5 py-4 text-right">Grand Total</th>
                          <th className="px-5 py-4">Payment</th>
                          <th className="px-5 py-4">Date & Time</th>
                          <th className="px-5 py-4">Order Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark/5 text-xs text-left">
                        {currentOrders.map(order => {
                          let badgeStyle = "bg-amber-50 text-amber-600 border-amber-100";
                          if (order.status === "Confirmed") badgeStyle = "bg-blue-50 text-blue-600 border-blue-100";
                          else if (order.status === "Packed") badgeStyle = "bg-purple-50 text-purple-600 border-purple-100";
                          else if (order.status === "Out for Delivery") badgeStyle = "bg-orange-50 text-orange-600 border-orange-100";
                          else if (order.status === "Delivered") badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                          else if (order.status === "Cancelled") badgeStyle = "bg-red-50 text-red-600 border-red-100";

                          return (
                            <tr key={order.orderId} className="hover:bg-background/30 transition-colors">
                              
                              {/* Order ID */}
                              <td className="px-5 py-3">
                                <button 
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-primary hover:text-primary-dark font-extrabold hover:underline underline-offset-2 transition-colors select-none text-left"
                                  title="Click to view detailed receipt"
                                >
                                  {order.orderId}
                                </button>
                              </td>

                              {/* Customer Details */}
                              <td className="px-5 py-3">
                                <p className="font-bold text-dark">{order.customerName}</p>
                                <p className="text-[10px] text-dark/45 mt-0.5">{order.email}</p>
                                <p className="text-[9px] text-dark/40 font-semibold">{order.phone}</p>
                              </td>

                              {/* Delivery Address */}
                              <td className="px-5 py-3 max-w-[200px]">
                                <p className="text-dark/70 truncate" title={order.deliveryAddress}>
                                  {order.deliveryAddress}
                                </p>
                              </td>

                              {/* Items */}
                              <td className="px-5 py-3 max-w-[220px]">
                                <div className="space-y-0.5 max-h-16 overflow-y-auto pr-1">
                                  {order.items && order.items.map((it, idx) => (
                                    <p key={idx} className="text-[11px] text-dark/75 truncate">
                                      <span className="font-bold text-dark">{it.quantity}x</span> {it.medicine_name}
                                    </p>
                                  ))}
                                </div>
                              </td>

                              {/* Total Quantity */}
                              <td className="px-5 py-3 text-center font-bold text-dark/65 select-none">
                                {order.totalQuantity}
                              </td>

                              {/* Grand Total */}
                              <td className="px-5 py-3 text-right font-extrabold text-dark select-none">
                                ₹{order.totalAmount}
                              </td>

                              {/* Payment details */}
                              <td className="px-5 py-3">
                                <p className="font-semibold text-dark/70 text-[11px]">{order.paymentMethod}</p>
                                
                                {order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery (COD)' ? (
                                  <>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mt-1 ${
                                      order.paymentStatus === 'Paid'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30'
                                        : 'bg-amber-50 text-amber-500 border border-amber-100/30'
                                    }`}>
                                      Payment Status: {order.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                                    </span>
                                    {order.paymentStatus !== 'Paid' ? (
                                      <button
                                        onClick={() => handleRequestCodConfirmation(order.orderId)}
                                        className="mt-1.5 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-extrabold uppercase rounded transition-all block cursor-pointer select-none"
                                      >
                                        ✓ Mark Payment as Confirmed
                                      </button>
                                    ) : (
                                      <div className="mt-1.5 space-y-0.5 text-left">
                                        <span className="text-[8px] font-extrabold text-emerald-600 uppercase block">✓ Payment Confirmed</span>
                                        {order.paymentConfirmedAt && (
                                          <span className="text-[8px] text-dark/45 block font-light leading-tight">
                                            Confirmed on: {new Date(order.paymentConfirmedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mt-1 ${
                                    order.paymentStatus === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30'
                                      : 'bg-amber-50 text-amber-500 border border-amber-100/30'
                                  }`}>
                                    {order.paymentStatus}
                                  </span>
                                )}
                              </td>

                              {/* Order Date */}
                              <td className="px-5 py-3 text-dark/65 font-medium select-none">
                                {new Date(order.orderDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                              </td>

                              {/* Order Status Select */}
                              <td className="px-5 py-3">
                                <select 
                                  value={order.status}
                                  onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                                  disabled={order.status === 'Cancelled'}
                                  className={`px-3 py-1.5 border border-dark/5 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-sm transition-all ${badgeStyle} ${order.status === 'Cancelled' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                {order.returnStatus && (
                                  <div className="mt-2 space-y-1 bg-amber-50/40 p-2 rounded-lg border border-amber-100/50">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase inline-block border ${
                                      order.returnStatus === 'requested'
                                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                                        : order.returnStatus === 'approved'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                          : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}>
                                      Return {order.returnStatus}
                                    </span>
                                    <p className="text-[9px] text-dark/65 font-medium leading-tight">
                                      Reason: <strong className="text-dark font-bold">{order.returnReason}</strong>
                                    </p>
                                    <p className="text-[9px] text-dark/65 font-medium leading-tight">
                                      Requested: <strong className="text-dark font-semibold">{new Date(order.returnRequestedAt).toLocaleDateString('en-IN')}</strong>
                                    </p>
                                    {order.returnStatus === 'requested' && (
                                      <div className="flex flex-col gap-1.5 mt-1.5">
                                        {order.refundStatus !== 'Refund Successful' && order.refundStatus !== 'successful' && order.refundStatus !== 'completed' ? (
                                          <button
                                            onClick={() => handleMarkRefundSuccessful(order.orderId)}
                                            className="w-full px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[8px] font-extrabold uppercase rounded transition-all cursor-pointer text-center block"
                                          >
                                            Refund Successful
                                          </button>
                                        ) : (
                                          <span className="w-full px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[8px] font-extrabold uppercase rounded text-center block select-none">
                                            ✓ Refund Successful
                                          </span>
                                        )}
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => handleUpdateReturnStatus(order.orderId, 'approved')}
                                            className="flex-1 px-1.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-extrabold uppercase rounded transition-all cursor-pointer text-center"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => handleUpdateReturnStatus(order.orderId, 'completed')}
                                            className="flex-1 px-1.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-extrabold uppercase rounded transition-all cursor-pointer text-center"
                                          >
                                            Complete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {order.returnStatus === 'approved' && (
                                      <div className="mt-1.5 space-y-1">
                                        {order.refundStatus === 'completed' ? (
                                          <div className="space-y-0.5">
                                            <span className="text-[8px] font-extrabold text-emerald-600 uppercase block">✓ Refund Completed</span>
                                            {order.refundTransactionId && (
                                              <span className="text-[7px] font-mono text-dark/45 block truncate max-w-[120px]">ID: {order.refundTransactionId}</span>
                                            )}
                                          </div>
                                        ) : (
                                          <>
                                            {(order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery (COD)') && !order.refundMethod ? (
                                              <span className="text-[7.5px] font-semibold text-amber-600 block italic leading-tight">Waiting for customer details</span>
                                            ) : (
                                              <button
                                                onClick={() => handleProcessRefund(order.orderId)}
                                                className="w-full px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-extrabold uppercase rounded transition-all cursor-pointer text-center"
                                              >
                                                Process Refund
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                            </tr>
                          );
                        })}
                        {sortedOrders.length === 0 && (
                          <tr>
                            <td colSpan="9" className="px-5 py-16 text-center text-dark/30 font-medium select-none">No orders found matching criteria.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination drawer */}
                {!ordersLoading && orderTotalPages > 1 && (
                  <div className="px-5 py-4 bg-background border-t border-dark/5 flex items-center justify-between select-none">
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">
                      Page {orderCurrentPage} of {orderTotalPages} ({sortedOrders.length} orders total)
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        disabled={orderCurrentPage === 1}
                        onClick={() => setOrderCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 rounded-lg border border-dark/10 text-dark/60 hover:bg-white hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdChevronLeft className="text-lg" />
                      </button>
                      
                      {Array.from({ length: orderTotalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setOrderCurrentPage(pageNum)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${pageNum === orderCurrentPage ? 'bg-primary border-primary text-white shadow-sm' : 'border-dark/10 hover:bg-white text-dark/65'}`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button 
                        disabled={orderCurrentPage === orderTotalPages}
                        onClick={() => setOrderCurrentPage(prev => Math.min(prev + 1, orderTotalPages))}
                        className="p-1.5 rounded-lg border border-dark/10 text-dark/60 hover:bg-white hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdChevronRight className="text-lg" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

            </div>
          )}

          {/* ================== MODULE 6: CUSTOMERS MANAGEMENT ================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Filters toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
                
                {/* Search */}
                <div className="relative flex-grow max-w-md">
                  <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40 text-lg" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, phone..."
                    value={customerSearchVal}
                    onChange={(e) => { setCustomerSearchVal(e.target.value); setCustomerCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-dark/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark font-semibold shadow-sm"
                  />
                  {customerSearchVal && (
                    <button 
                      onClick={() => setCustomerSearchVal("")} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 p-0.5 rounded-full hover:bg-background transition-colors"
                    >
                      <MdClose className="text-sm" />
                    </button>
                  )}
                </div>

                {/* Filter and Sort options */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  {/* "+ New customers" indicator button */}
                  <span className="px-3.5 py-2.5 bg-primary/5 border border-primary/10 text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <MdPeople className="text-base" />
                    New customers
                  </span>

                  {/* Sort select dropdown */}
                  <div className="flex items-center gap-2 bg-white border border-dark/5 px-3 py-1.5 rounded-xl shadow-sm">
                    <MdFilterList className="text-dark/50 text-base" />
                    <select 
                      value={customerSortOption}
                      onChange={(e) => { setCustomerSortOption(e.target.value); setCustomerCurrentPage(1); }}
                      className="bg-transparent text-xs font-bold text-dark/80 outline-none cursor-pointer pr-4 border-none"
                    >
                      <option value="Newest joined">Newest joined</option>
                      <option value="Most orders">Most orders</option>
                      <option value="Highest spend">Highest spend</option>
                      <option value="Name A-Z">Name A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customers Data Table Card */}
              <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-premium rounded-[28px] overflow-hidden">
                <div className="table-responsive-container">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-background border-b border-dark/5 text-left text-[10px] uppercase font-black text-dark/45 select-none">
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Orders</th>
                        <th className="px-6 py-4">Lifetime spend</th>
                        <th className="px-6 py-4">Joined Date</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark/5 text-xs">
                      {currentCustomers.map(cust => {
                        const initials = cust.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <tr key={cust.id} className="hover:bg-background/30 transition-colors">
                            
                            {/* Customer details with avatar */}
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${getAvatarBg(cust.name)}`}>
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-dark truncate leading-none">{cust.name}</p>
                                  <p className="text-[10px] text-dark/40 font-medium tracking-wider uppercase mt-1.5">{cust.id}</p>
                                </div>
                              </div>
                            </td>

                            {/* Contact info */}
                            <td className="px-6 py-3.5">
                              <div className="space-y-1.5 text-dark/65 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <MdMailOutline className="text-dark/45 text-sm shrink-0" />
                                  <span className="truncate">{cust.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MdPhone className="text-dark/45 text-sm shrink-0" />
                                  <span>{cust.phone}</span>
                                </div>
                              </div>
                            </td>

                            {/* Orders count */}
                            <td className="px-6 py-3.5 font-bold text-dark select-none text-center sm:text-left">
                              {cust.orders}
                            </td>

                            {/* Spend */}
                            <td className="px-6 py-3.5 font-extrabold text-dark select-none">
                              ₹{cust.spend.toLocaleString()}
                            </td>

                            {/* Joined */}
                            <td className="px-6 py-3.5 font-semibold text-dark/60 select-none">
                              {cust.joinedDate}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-3.5 text-center select-none">
                              {cust.isBlocked ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                                  Active
                                </span>
                              )}
                            </td>

                            {/* View / Actions */}
                            <td className="px-6 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <button 
                                  onClick={() => setViewingCustomerOrders(cust)}
                                  className="text-primary hover:text-primary-dark font-extrabold hover:underline cursor-pointer"
                                >
                                  View
                                </button>
                                {!cust.isBlocked ? (
                                  <button 
                                    onClick={() => setCustomerToBlock(cust)}
                                    className="text-red-600 hover:text-red-800 font-extrabold hover:underline cursor-pointer"
                                  >
                                    Block
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => setCustomerToUnblock(cust)}
                                    className="text-[#009688] hover:text-[#00796B] font-extrabold hover:underline cursor-pointer"
                                  >
                                    Unblock
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-dark/30 font-medium select-none">No customers found matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {customerTotalPages > 1 && (
                  <div className="px-6 py-4 bg-background border-t border-dark/5 flex items-center justify-between select-none">
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">
                      Page {customerCurrentPage} of {customerTotalPages} ({filteredCustomers.length} customers total)
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        disabled={customerCurrentPage === 1}
                        onClick={() => setCustomerCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 rounded-lg border border-dark/10 text-dark/60 hover:bg-white hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdChevronLeft className="text-lg" />
                      </button>
                      
                      {Array.from({ length: customerTotalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setCustomerCurrentPage(pageNum)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${pageNum === customerCurrentPage ? 'bg-primary border-primary text-white shadow-sm' : 'border-dark/10 hover:bg-white text-dark/65'}`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button 
                        disabled={customerCurrentPage === customerTotalPages}
                        onClick={() => setCustomerCurrentPage(prev => Math.min(prev + 1, customerTotalPages))}
                        className="p-1.5 rounded-lg border border-dark/10 text-dark/60 hover:bg-white hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdChevronRight className="text-lg" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

            </div>
          )}

          {/* ================== TAB: COUPONS & OFFERS ================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              {/* Upper search and action row */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/35 text-lg" />
                  <input 
                    type="text" 
                    placeholder="Search coupon code or description..."
                    value={couponSearchVal}
                    onChange={(e) => setCouponSearchVal(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark/10 rounded-xl text-xs outline-none focus:border-primary shadow-soft"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
                  <div className="flex bg-white border border-dark/5 p-1 rounded-xl shadow-soft">
                    {['All', 'Active', 'Expired'].map(st => (
                      <button 
                        key={st}
                        onClick={() => setCouponStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          couponStatusFilter === st ? 'bg-primary text-white shadow-sm' : 'text-dark/55 hover:text-dark'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={openAddCouponModal}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#009688] hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-sm transition-colors shrink-0 ml-auto cursor-pointer"
                  >
                    <MdAddCircleOutline className="text-base" /> Create Coupon
                  </button>
                </div>
              </div>

              {/* Coupons Table List */}
              <Card padding="p-0" className="overflow-hidden bg-white border border-dark/5 shadow-soft">
                {couponsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs text-dark/45 font-medium">Fetching coupons database...</p>
                  </div>
                ) : (
                  <div className="table-responsive-container w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-background border-b border-dark/5 text-dark/50 font-extrabold uppercase select-none">
                          <th className="px-5 py-4">Code</th>
                          <th className="px-5 py-4">Discount</th>
                          <th className="px-5 py-4">Description</th>
                          <th className="px-5 py-4">Expiry Date</th>
                          <th className="px-5 py-4 text-center">Min Order / Cap</th>
                          <th className="px-5 py-4 text-center">Status</th>
                          <th className="px-5 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark/5 font-medium text-dark/75">
                        {(() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const list = coupons.filter(c => {
                            const matchesSearch = c.couponCode.toLowerCase().includes(couponSearchVal.toLowerCase()) || 
                              (c.description || '').toLowerCase().includes(couponSearchVal.toLowerCase());
                            const isExpired = c.expiryDate && c.expiryDate < todayStr;
                            
                            if (couponStatusFilter === 'Active') {
                              return matchesSearch && c.status === 'active' && !isExpired;
                            }
                            if (couponStatusFilter === 'Expired') {
                              return matchesSearch && isExpired;
                            }
                            return matchesSearch;
                          });

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-dark/30 font-medium select-none">
                                  No coupons found matching filters.
                                </td>
                              </tr>
                            );
                          }

                          return list.map((cp) => {
                            const isExpired = cp.expiryDate && cp.expiryDate < todayStr;
                            return (
                              <tr key={cp.id} className="hover:bg-background/40 transition-colors">
                                <td className="px-5 py-4 font-bold text-dark tracking-wider select-all uppercase">
                                  {cp.couponCode}
                                </td>
                                <td className="px-5 py-4 text-emerald-600 font-extrabold text-sm">
                                  {cp.discount}% OFF
                                </td>
                                <td className="px-5 py-4 max-w-[200px] truncate text-dark/60 font-light" title={cp.description}>
                                  {cp.description || 'No description'}
                                </td>
                                <td className="px-5 py-4 font-mono text-dark/60">
                                  {cp.expiryDate} {isExpired && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100/50 ml-1">EXPIRED</span>}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="text-dark/50">₹{cp.minimumOrder || 0}</span>
                                  <span className="text-dark/25 mx-1">/</span>
                                  <span className="text-dark/60 font-semibold">{cp.maximumDiscount ? `₹${cp.maximumDiscount}` : 'None'}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <button 
                                    onClick={() => toggleCouponStatus(cp)}
                                    disabled={isExpired}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      isExpired 
                                        ? 'bg-red-50 text-red-400 border border-red-100 cursor-not-allowed' 
                                        : cp.status === 'active' 
                                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50' 
                                          : 'bg-dark/5 text-dark/50 hover:bg-dark/10 border border-dark/10'
                                    }`}
                                  >
                                    {isExpired ? 'Expired' : cp.status}
                                  </button>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <button 
                                      onClick={() => openEditCouponModal(cp)}
                                      className="w-8 h-8 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center transition-colors cursor-pointer"
                                      title="Edit Coupon"
                                    >
                                      <MdEdit className="text-base" />
                                    </button>
                                    <button 
                                      onClick={() => openDeleteCouponConfirm(cp)}
                                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Delete Coupon"
                                    >
                                      <MdDelete className="text-base" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ================== TAB: DELIVERY SETTINGS ================== */}
          {activeTab === 'delivery' && (
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <Card padding="p-6 sm:p-8" className="bg-white border border-dark/5 shadow-premium rounded-[24px]">
                <div className="border-b border-dark/5 pb-4 mb-6">
                  <h3 className="text-base font-extrabold text-[#063B44] tracking-tight">Delivery Center (Hub) Setup</h3>
                  <p className="text-xs text-dark/45 mt-0.5">Define coordinates of the primary pharmacy dispatch warehouse.</p>
                </div>

                <form onSubmit={handleSaveDeliverySettings} className="space-y-6">
                  {/* Coordinates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Hub Latitude *</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={delHubLat}
                        onChange={(e) => setDelHubLat(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 17.4230"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Hub Longitude *</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={delHubLng}
                        onChange={(e) => setDelHubLng(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 78.3460"
                      />
                    </div>
                  </div>

                  <div className="border-b border-dark/5 pb-4 pt-2">
                    <h3 className="text-base font-extrabold text-[#063B44] tracking-tight">Zone Boundaries & Fees</h3>
                    <p className="text-xs text-dark/45 mt-0.5">Control delivery charges, free shipping rules, and service distance caps.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Base Delivery Fee (₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={delBaseFee}
                        onChange={(e) => setDelBaseFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Free Delivery Threshold (₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={delFreeThreshold}
                        onChange={(e) => setDelFreeThreshold(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Priority Radius (KM) *</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={delPriorityRadius}
                        onChange={(e) => setDelPriorityRadius(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 5.0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Maximum Service Radius (KM) *</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={delMaxRadius}
                        onChange={(e) => setDelMaxRadius(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 15.0"
                      />
                    </div>
                  </div>

                  <div className="border-b border-dark/5 pb-4 pt-2">
                    <h3 className="text-base font-extrabold text-[#063B44] tracking-tight">Delivery Timelines</h3>
                    <p className="text-xs text-dark/45 mt-0.5">Customer-facing labels displayed during checkout.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Priority Delivery Time *</label>
                      <input 
                        type="text" 
                        required
                        value={delPriorityTime}
                        onChange={(e) => setDelPriorityTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 1 Hour"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Standard Delivery Time *</label>
                      <input 
                        type="text" 
                        required
                        value={delStandardTime}
                        onChange={(e) => setDelStandardTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 24 Hours"
                      />
                    </div>
                  </div>

                  {/* Delivery Enabled Toggle */}
                  <div className="flex items-center justify-between p-4 bg-background border border-dark/5 rounded-2xl">
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-dark">Enable Deliveries</p>
                      <p className="text-[10px] text-dark/45">Disable to halt all shipping actions across the store.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setDelEnabled(!delEnabled)}
                      className={`w-12 h-6 rounded-full p-1 transition-all ${
                        delEnabled ? 'bg-primary flex justify-end' : 'bg-dark/10 flex justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit"
                      disabled={deliverySettingsSaving}
                      className="px-8 py-3.5 bg-[#009688] hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {deliverySettingsSaving ? "Saving..." : "Save Configuration"}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* ================== TAB: HEALTH BLOGS ================== */}
          {activeTab === 'blogs' && (
            <div className="space-y-6 text-left">
              {/* Header and Add Button controls bar */}
              <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-grow select-none">
                  {/* Search input */}
                  <div className="relative flex-grow max-w-xs">
                    <input 
                      type="text" 
                      placeholder="Search articles..."
                      value={blogSearchVal}
                      onChange={(e) => setBlogSearchVal(e.target.value)}
                      className="w-full text-xs px-3.5 pl-9 py-2.5 bg-background border border-dark/10 rounded-xl outline-none focus:border-primary text-dark font-medium"
                    />
                    <MdSearch className="absolute left-3 top-3 text-dark/45 text-base" />
                  </div>

                  {/* Category Filter */}
                  <select 
                    value={blogCategoryFilter}
                    onChange={(e) => setBlogCategoryFilter(e.target.value)}
                    className="border border-dark/10 bg-white text-xs font-bold text-dark/70 rounded-xl py-2 px-3 outline-none cursor-pointer hover:bg-background"
                  >
                    <option value="All">All Categories</option>
                    <option value="Heart Health">Heart Health</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Diabetes Care">Diabetes Care</option>
                    <option value="Mental Wellness">Mental Wellness</option>
                  </select>
                </div>

                <button 
                  onClick={openAddBlogModal}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#009688] hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <MdAddCircleOutline className="text-base" /> Write Article
                </button>
              </div>

              {/* Blogs Table Card list */}
              <Card padding="p-0" className="overflow-hidden bg-white border border-dark/5 shadow-soft">
                {blogsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs text-dark/45 font-medium">Fetching articles database...</p>
                  </div>
                ) : (
                  <div className="table-responsive-container w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-background border-b border-dark/5 text-dark/50 font-extrabold uppercase select-none">
                          <th className="px-5 py-4">Banners</th>
                          <th className="px-5 py-4">Title & Category</th>
                          <th className="px-5 py-4">Author</th>
                          <th className="px-5 py-4">Date & Read Time</th>
                          <th className="px-5 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark/5">
                        {blogs
                          .filter(b => {
                            const matchesSearch = b.title.toLowerCase().includes(blogSearchVal.toLowerCase()) || 
                                                  b.author.toLowerCase().includes(blogSearchVal.toLowerCase()) ||
                                                  b.content.toLowerCase().includes(blogSearchVal.toLowerCase());
                            const matchesCat = blogCategoryFilter === 'All' || b.category === blogCategoryFilter;
                            return matchesSearch && matchesCat;
                          })
                          .map((b) => (
                            <tr key={b.id} className="hover:bg-background/45 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="w-14 h-10 rounded-lg overflow-hidden border border-dark/5 select-none bg-dark/5">
                                  <img 
                                    src={b.image} 
                                    alt={b.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = "https://images.unsplash.com/photo-1584017911766-6477ef9798f1?auto=format&fit=crop&w=400&q=80";
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="space-y-0.5 max-w-[280px]">
                                  <p className="font-extrabold text-dark line-clamp-1 leading-snug">{b.title}</p>
                                  <span className="bg-primary/10 text-primary-dark font-black text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider inline-block leading-none">
                                    {b.category}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-dark/75 font-semibold">
                                {b.author}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-dark/55">
                                <p className="font-semibold text-dark/70">{b.date}</p>
                                <p className="text-[10px] font-light mt-0.5">{b.readTime || '5 min read'}</p>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => openEditBlogModal(b)}
                                    className="p-2 text-[#009688] hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                                    title="Edit Article"
                                  >
                                    <MdEdit className="text-base" />
                                  </button>
                                  <button 
                                    onClick={() => openDeleteBlogConfirm(b)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer"
                                    title="Delete Article"
                                  >
                                    <MdDelete className="text-base" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                        {blogs.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-5 py-12 text-center text-dark/45 font-light">
                              No blog articles found in database. Click "Write Article" to publish your first post.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ================== TAB: VERIFY PRESCRIPTIONS ================== */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6 text-left animate-fadeIn">
              
              <div className="bg-white border border-dark/5 p-6 rounded-[24px] shadow-soft flex justify-between items-center select-none">
                <div>
                  <h3 className="text-base font-extrabold text-[#063B44] tracking-tight">Prescription Approvals Queue</h3>
                  <p className="text-xs text-dark/45 mt-0.5">Review, verify, and approve patient-uploaded prescriptions for Rx orders.</p>
                </div>
              </div>

              {prescriptionsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-t-primary border-primary/20 rounded-full animate-spin mx-auto"></div>
                  <span className="text-xs text-dark/40 font-bold mt-2 block">Loading prescriptions...</span>
                </div>
              ) : prescriptions.length === 0 ? (
                <Card hoverable={false} padding="p-8" className="bg-white border border-dark/5 shadow-soft rounded-[20px] text-center">
                  <MdLocalPharmacy className="text-dark/25 text-4xl mx-auto mb-2" />
                  <h4 className="font-bold text-dark text-xs uppercase tracking-wider">No Prescriptions Uploaded</h4>
                  <p className="text-[10px] text-dark/40 mt-1">Uploaded customer prescriptions will automatically appear here for verification.</p>
                </Card>
              ) : (
                <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-premium rounded-[28px] overflow-hidden">
                  <div className="table-responsive-container">
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        <tr className="bg-background border-b border-dark/5 text-left text-[10px] uppercase font-black text-dark/45 select-none">
                          <th className="px-5 py-4 w-28">ID</th>
                          <th className="px-5 py-4">File Name & Size</th>
                          <th className="px-5 py-4">Customer Details</th>
                          <th className="px-5 py-4">Uploaded At</th>
                          <th className="px-5 py-4 text-center">Status</th>
                          <th className="px-5 py-4 text-center">Review Decisions</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark/5 text-xs text-left">
                        {prescriptions.map((rx) => (
                          <tr key={rx.id} className="hover:bg-background/40 transition-colors">
                            <td className="px-5 py-4 font-bold text-dark">{rx.id}</td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-dark truncate max-w-[200px]" title={rx.fileName}>{rx.fileName}</p>
                              <p className="text-[10px] text-dark/45 mt-0.5">{rx.fileSize || 'N/A'}</p>
                            </td>
                            <td className="px-5 py-4 font-medium text-dark/85">{rx.userId}</td>
                            <td className="px-5 py-4 text-dark/60">
                              {rx.uploadTime ? new Date(rx.uploadTime).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {rx.reviewStatus === 'approved' && (
                                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                  Approved
                                </span>
                              )}
                              {rx.reviewStatus === 'rejected' && (
                                <div className="space-y-1 inline-block">
                                  <span className="bg-red-50 text-red-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wider block">
                                    Rejected
                                  </span>
                                  {rx.rejectionReason && (
                                    <p className="text-[9px] text-red-500 max-w-[120px] truncate" title={rx.rejectionReason}>
                                      {rx.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              )}
                              {(rx.reviewStatus === 'under_review' || !rx.reviewStatus) && (
                                <span className="bg-amber-50 text-amber-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider">
                                  Under Review
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAdminUpdatePrescriptionStatus(rx.id, 'under_review')}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[9px] uppercase rounded border border-amber-200 transition-all cursor-pointer"
                                >
                                  Review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdminUpdatePrescriptionStatus(rx.id, 'approved')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase rounded border border-emerald-200 transition-all cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt("Enter reason for rejection:", "Image blurred / Missing doctor signature / Invalid prescription");
                                    if (reason !== null) {
                                      handleAdminUpdatePrescriptionStatus(rx.id, 'rejected', reason || "Invalid prescription details");
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-[9px] uppercase rounded border border-red-200 transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrescriptionModal(rx)}
                                  className="px-2.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-[10px] uppercase rounded-lg shadow-sm transition-all cursor-pointer"
                                >
                                  View
                                </button>
                                {rx.downloadUrl ? (
                                  <>
                                    <a
                                      href={rx.downloadUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1.5 border border-dark/10 hover:bg-background text-dark font-extrabold text-[10px] uppercase rounded-lg transition-all"
                                    >
                                      Tab
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFile(rx.downloadUrl, rx.fileName)}
                                      className="px-2.5 py-1.5 border border-dark/10 hover:bg-background text-dark font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer"
                                    >
                                      Down
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-dark/30 italic">Mock</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

            </div>
          )}

          {/* ================== TAB: SYSTEM SETTINGS ================== */}
          {activeTab === 'system' && (

            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <Card padding="p-6 sm:p-8" className="bg-white border border-dark/5 shadow-premium rounded-[24px]">
                <div className="border-b border-dark/5 pb-4 mb-6">
                  <h3 className="text-base font-extrabold text-[#063B44] tracking-tight">System Status Switches</h3>
                  <p className="text-xs text-dark/45 mt-0.5">Control the global availability of the website and checkout actions.</p>
                </div>

                <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                  <div className="space-y-3.5">
                    {/* Store Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-background border border-dark/5 rounded-2xl">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold text-dark">Store Status (Open / Closed)</p>
                        <p className="text-[10px] text-dark/45">When Closed, checkout is disabled but customers can browse medicines.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSysStoreOpen(!sysStoreOpen)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                          sysStoreOpen ? 'bg-primary flex justify-end' : 'bg-dark/10 flex justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
                      </button>
                    </div>

                    {/* Maintenance Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-background border border-dark/5 rounded-2xl">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold text-dark">Maintenance Mode</p>
                        <p className="text-[10px] text-dark/45">Redirects all public customers to a scheduled maintenance screen.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSysMaintenance(!sysMaintenance)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                          sysMaintenance ? 'bg-primary flex justify-end' : 'bg-dark/10 flex justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
                      </button>
                    </div>

                    {/* Enable Notifications */}
                    <div className="flex items-center justify-between p-4 bg-background border border-dark/5 rounded-2xl">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold text-dark">Enable Site Notifications</p>
                        <p className="text-[10px] text-dark/45">Allow sending updates to customers and administrators.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSysNotifications(!sysNotifications)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                          sysNotifications ? 'bg-primary flex justify-end' : 'bg-dark/10 flex justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-dark/5 pb-4 pt-2">
                    <h3 className="text-base font-extrabold text-[#063B44] tracking-tight">Support Coordinates</h3>
                    <p className="text-xs text-dark/45 mt-0.5">Update telephone numbers, support emails, and timings globally.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Support Phone *</label>
                      <input 
                        type="text" 
                        required
                        value={sysPhone}
                        onChange={(e) => setSysPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. +1 (555) 019-2834"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Support Email *</label>
                      <input 
                        type="email" 
                        required
                        value={sysEmail}
                        onChange={(e) => setSysEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. support@mediquick.com"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-dark/55 uppercase tracking-wider block">Operating Hours *</label>
                      <input 
                        type="text" 
                        required
                        value={sysHours}
                        onChange={(e) => setSysHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-dark/10 rounded-xl text-xs outline-none focus:border-primary bg-background"
                        placeholder="e.g. 24/7, 365 Days"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit"
                      disabled={systemSettingsSaving}
                      className="px-8 py-3.5 bg-[#009688] hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {systemSettingsSaving ? "Saving..." : "Save Configuration"}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* ================== TAB: PRODUCT REVIEWS ================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 text-left animate-fadeIn">
              
              {/* Controls bar */}
              <div className="bg-white p-5 rounded-[24px] border border-dark/5 shadow-soft flex flex-wrap gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark/35">
                    <MdSearch className="text-lg" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by product name or user name..."
                    value={reviewSearchVal}
                    onChange={(e) => setReviewSearchVal(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-[#F8FCFC] border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  />
                </div>

                {/* Filters & Sorting */}
                <div className="flex flex-wrap gap-3 items-center">
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 bg-[#F8FCFC] px-3.5 py-1.5 rounded-xl border border-dark/5">
                    <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wider">Category:</span>
                    <select
                      value={reviewCategoryFilter}
                      onChange={(e) => setReviewCategoryFilter(e.target.value)}
                      className="text-xs font-bold text-[#063B44] bg-transparent border-0 outline-none cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div className="flex items-center gap-1.5 bg-[#F8FCFC] px-3.5 py-1.5 rounded-xl border border-dark/5">
                    <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wider">Rating:</span>
                    <select
                      value={reviewRatingFilter}
                      onChange={(e) => setReviewRatingFilter(e.target.value)}
                      className="text-xs font-bold text-[#063B44] bg-transparent border-0 outline-none cursor-pointer"
                    >
                      <option value="All">All Stars</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>

                  {/* Sort Option */}
                  <div className="flex items-center gap-1.5 bg-[#F8FCFC] px-3.5 py-1.5 rounded-xl border border-dark/5">
                    <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wider">Sort:</span>
                    <select
                      value={reviewSortOption}
                      onChange={(e) => setReviewSortOption(e.target.value)}
                      className="text-xs font-bold text-[#063B44] bg-transparent border-0 outline-none cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Reviews Table / Grid */}
              <div className="bg-white border border-dark/5 shadow-premium rounded-[24px] overflow-hidden">
                {reviewsLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="relative w-10 h-10">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="py-20 text-center text-dark/40 font-bold text-xs italic">
                    No matching reviews found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-responsive-container">
                      <thead>
                        <tr className="bg-[#F8FCFC] border-b border-dark/5 text-[10px] font-black uppercase tracking-wider text-dark/45 select-none">
                          <th className="py-4 px-6">Product</th>
                          <th className="py-4 px-6">User</th>
                          <th className="py-4 px-6">Rating</th>
                          <th className="py-4 px-6">Review details</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark/5">
                        {filteredReviews.map((rev) => {
                          const prod = products.find((p) => p.id === rev.productId);
                          if (!prod) return null;

                          let formattedDate = 'Recent';
                          if (rev.createdAt) {
                            const dateObj = rev.createdAt.toDate ? rev.createdAt.toDate() : new Date(rev.createdAt);
                            if (!isNaN(dateObj.getTime())) {
                              formattedDate = dateObj.toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              });
                            }
                          }

                          return (
                            <tr key={rev.id} className="hover:bg-[#F8FCFC]/30 transition-colors text-xs">
                              
                              {/* Product Info */}
                              <td className="py-4 px-6 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-background rounded-lg border border-dark/5 overflow-hidden shrink-0 flex items-center justify-center">
                                    <MedicineImage medicine={prod} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <span className="font-bold text-dark block truncate max-w-[150px]" title={prod.medicine_name}>
                                      {prod.medicine_name}
                                    </span>
                                    <span className="text-[9px] font-black uppercase text-primary bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                      {prod.category}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* User Info */}
                              <td className="py-4 px-6">
                                <div className="text-left">
                                  <span className="font-bold text-dark block">{rev.userName}</span>
                                  <span className="text-[10px] text-dark/45 block mt-0.5">{rev.userEmail || '—'}</span>
                                </div>
                              </td>

                              {/* Rating Stars */}
                              <td className="py-4 px-6">
                                <div className="flex flex-col items-start gap-1">
                                  {renderAdminReviewStars(rev.rating)}
                                  <span className="text-[10px] font-extrabold text-dark/50">{rev.rating} / 5</span>
                                </div>
                              </td>

                              {/* Review Text */}
                              <td className="py-4 px-6 max-w-[280px]">
                                <div className="text-left space-y-1">
                                  {rev.title && (
                                    <h4 className="font-bold text-dark truncate" title={rev.title}>{rev.title}</h4>
                                  )}
                                  <p className="text-dark/70 font-light leading-relaxed break-words line-clamp-2" title={rev.review}>
                                    {rev.review}
                                  </p>
                                </div>
                              </td>

                              {/* Review Date */}
                              <td className="py-4 px-6 text-dark/50 font-medium whitespace-nowrap">
                                {formattedDate}
                              </td>

                              {/* Review Status */}
                              <td className="py-4 px-6">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${
                                  rev.status === 'hidden' 
                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {rev.status === 'hidden' ? 'Hidden' : 'Visible'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleToggleReviewVisibility(rev)}
                                    title={rev.status === 'hidden' ? "Unhide Review" : "Hide Review"}
                                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                      rev.status === 'hidden'
                                        ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-600'
                                        : 'bg-amber-50 border-amber-100 hover:bg-amber-100 text-amber-600'
                                    }`}
                                  >
                                    {rev.status === 'hidden' ? <MdVisibility className="text-base" /> : <MdVisibilityOff className="text-base" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdminReview(rev)}
                                    title="Delete Review"
                                    className="p-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <MdDelete className="text-base" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
          
        </div>
      </main>

      {/* ================== MODAL: ADD MEDICINE ================== */}
      <Modal 
        isOpen={addMedModalOpen} 
        onClose={() => setAddMedModalOpen(false)} 
        title="Add New Medicine Profile"
        size="xl"
      >
        {addMedError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-semibold leading-relaxed">
            <MdErrorOutline className="text-red-500 text-lg shrink-0 mt-0.5" />
            <span>{addMedError}</span>
          </div>
        )}
        {addMedSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold leading-relaxed">
            <MdCheckCircle className="text-emerald-600 text-lg shrink-0 mt-0.5" />
            <span>{addMedSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAddMedSubmit} className="space-y-6 text-left">
          {/* SECTION: Basic particulars */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Basic Particulars</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Medicine Name *</label>
                <input 
                  type="text" 
                  name="medicine_name" 
                  value={addMedData.medicine_name} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Dolo 650 Tablet"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Brand Name *</label>
                <input 
                  type="text" 
                  name="brand" 
                  value={addMedData.brand} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Micro Labs"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Manufacturer Company</label>
                <input 
                  type="text" 
                  name="manufacturer" 
                  value={addMedData.manufacturer} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Micro Labs Ltd"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Generic Chemical Formula</label>
                <input 
                  type="text" 
                  name="generic_name" 
                  value={addMedData.generic_name} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Paracetamol (650mg)"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Classification & Pricing */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Classification & Finance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Store Category *</label>
                <select 
                  name="category"
                  value={addMedData.category}
                  onChange={handleAddMedChange}
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                  required
                >
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Subcategory Tab</label>
                <input 
                  type="text" 
                  name="subcategory" 
                  value={addMedData.subcategory} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Tablets, Syrups, Pain Relief"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Prescription Requirement</label>
                <div className="h-11 flex items-center">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-dark/75 select-none hover:text-primary transition-colors">
                    <input 
                      type="checkbox" 
                      name="prescription_required"
                      checked={addMedData.prescription_required}
                      onChange={handleAddMedChange}
                      className="rounded text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <span>Requires Doctor Prescription (Rx)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">MRP Price (₹) *</label>
                <input 
                  type="number" 
                  name="mrp" 
                  value={addMedData.mrp} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. 34"
                  step="0.01"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Retail Selling Price (₹) *</label>
                <input 
                  type="number" 
                  name="price" 
                  value={addMedData.price} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. 30"
                  step="0.01"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Inventory Stock Quantity *</label>
                <input 
                  type="number" 
                  name="stock" 
                  value={addMedData.stock} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. 120"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION: Dosage particulars */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Dosage & Composition</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Dosage Form</label>
                <select 
                  name="form"
                  value={addMedData.form}
                  onChange={handleAddMedChange}
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                >
                  {formsList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Active Strength</label>
                <input 
                  type="text" 
                  name="strength" 
                  value={addMedData.strength} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. 650mg, 200ml"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Pack Size Designation</label>
                <input 
                  type="text" 
                  name="pack_size" 
                  value={addMedData.pack_size} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Strip of 15 Tablets"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Description details */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Descriptions & Indications</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Key Medical Uses</label>
                <textarea 
                  name="uses" 
                  rows="2"
                  value={addMedData.uses} 
                  onChange={handleAddMedChange} 
                  placeholder="e.g. Treatment of Fever, Mild to Moderate Pain Relief."
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Product Description</label>
                <textarea 
                  name="description" 
                  rows="3"
                  value={addMedData.description} 
                  onChange={handleAddMedChange} 
                  placeholder="Provide brief safety warnings, usage instructions, or benefits..."
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Product Media */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Product Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Upload Packaging Image</label>
                  <div className="relative group border-2 border-dashed border-dark/10 hover:border-primary/40 rounded-2xl p-5 bg-background hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAddMedFile}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <MdPhotoCamera className="text-2xl text-dark/35 group-hover:text-primary/75 transition-colors mb-1.5" />
                    <p className="text-[11px] font-semibold text-dark/80 group-hover:text-primary transition-colors">Drag and drop file or click to browse</p>
                    <p className="text-[9px] text-dark/45 mt-0.5">Supports JPEG, PNG, WEBP</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 select-none">
                  <div className="h-px bg-dark/5 flex-grow"></div>
                  <span className="text-[9px] text-dark/40 uppercase font-black">OR</span>
                  <div className="h-px bg-dark/5 flex-grow"></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Direct Image URL Link</label>
                  <input 
                    type="url" 
                    name="image_url" 
                    value={addMedData.image_url} 
                    onChange={handleAddMedChange} 
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="md:col-span-5 flex flex-col items-center justify-center border border-dark/5 bg-background p-4 rounded-2xl min-h-[170px] w-full text-center">
                {addMedImagePreview || addMedData.image_url ? (
                  <div className="space-y-2 w-full flex flex-col items-center select-none">
                    <span className="text-[9px] text-dark/45 uppercase tracking-wider font-bold">Image Preview</span>
                    <div className="product-image-container shadow-sm">
                      <img 
                        src={addMedImagePreview || addMedData.image_url} 
                        alt="Packaging Preview" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-584017911766-6477ef9798f1?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                    {addMedImageFile && (
                      <div className="flex items-center gap-1 bg-white border border-dark/5 px-2 py-0.5 rounded-lg shadow-sm">
                        <span className="text-[9px] text-dark/70 font-semibold truncate max-w-[100px]">{addMedImageFile.name}</span>
                        <button 
                          type="button" 
                          onClick={() => { setAddMedImageFile(null); setAddMedImagePreview(null); }}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-50"
                        >
                          <MdClose className="text-xs" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-dark/35 space-y-0.5 text-center select-none">
                    <p className="text-xs font-semibold">No Image Selected</p>
                    <p className="text-[9px] leading-relaxed max-w-[150px] mx-auto">Upload a file or provide a url link to see preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-dark/5 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-grow py-3.5 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl shadow active:scale-[0.98]"
            >
              Add Medicine to Catalog
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddMedModalOpen(false)}
              className="border-dark/15 text-dark hover:bg-background text-xs px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================== MODAL: EDIT MEDICINE ================== */}
      <Modal 
        isOpen={editMedModalOpen} 
        onClose={() => setEditMedModalOpen(false)} 
        title="Edit Medicine Profile"
        size="xl"
      >
        {editMedError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-semibold leading-relaxed">
            <MdErrorOutline className="text-red-500 text-lg shrink-0 mt-0.5" />
            <span>{editMedError}</span>
          </div>
        )}
        {editMedSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold leading-relaxed">
            <MdCheckCircle className="text-emerald-600 text-lg shrink-0 mt-0.5" />
            <span>{editMedSuccess}</span>
          </div>
        )}

        <form onSubmit={handleEditMedSubmit} className="space-y-6 text-left">
          {/* SECTION: Basic particulars */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Basic Particulars</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Medicine Name *</label>
                <input 
                  type="text" 
                  name="medicine_name" 
                  value={editMedData.medicine_name} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Brand Name *</label>
                <input 
                  type="text" 
                  name="brand" 
                  value={editMedData.brand} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Manufacturer Company</label>
                <input 
                  type="text" 
                  name="manufacturer" 
                  value={editMedData.manufacturer} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Generic Chemical Formula</label>
                <input 
                  type="text" 
                  name="generic_name" 
                  value={editMedData.generic_name} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Classification & Finance */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Classification & Finance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Store Category *</label>
                <select 
                  name="category"
                  value={editMedData.category}
                  onChange={handleEditMedChange}
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                  required
                >
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Subcategory Tab</label>
                <input 
                  type="text" 
                  name="subcategory" 
                  value={editMedData.subcategory} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Prescription Requirement</label>
                <div className="h-11 flex items-center">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-dark/75 select-none hover:text-primary transition-colors">
                    <input 
                      type="checkbox" 
                      name="prescription_required"
                      checked={editMedData.prescription_required}
                      onChange={handleEditMedChange}
                      className="rounded text-primary focus:ring-primary/20 border-dark/15 w-4 h-4 cursor-pointer"
                    />
                    <span>Requires Doctor Prescription (Rx)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">MRP Price (₹) *</label>
                <input 
                  type="number" 
                  name="mrp" 
                  value={editMedData.mrp} 
                  onChange={handleEditMedChange} 
                  step="0.01"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Retail Selling Price (₹) *</label>
                <input 
                  type="number" 
                  name="price" 
                  value={editMedData.price} 
                  onChange={handleEditMedChange} 
                  step="0.01"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Inventory Stock Quantity *</label>
                <input 
                  type="number" 
                  name="stock" 
                  value={editMedData.stock} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION: Dosage particulars */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Dosage & Composition</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Dosage Form</label>
                <select 
                  name="form"
                  value={editMedData.form}
                  onChange={handleEditMedChange}
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                >
                  {formsList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Active Strength</label>
                <input 
                  type="text" 
                  name="strength" 
                  value={editMedData.strength} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Pack Size Designation</label>
                <input 
                  type="text" 
                  name="pack_size" 
                  value={editMedData.pack_size} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Description details */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Descriptions & Indications</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Key Medical Uses</label>
                <textarea 
                  name="uses" 
                  rows="2"
                  value={editMedData.uses} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Product Description</label>
                <textarea 
                  name="description" 
                  rows="3"
                  value={editMedData.description} 
                  onChange={handleEditMedChange} 
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Product Media */}
          <div className="space-y-4 pt-4 border-t border-dark/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary border-l-2 border-primary pl-2 select-none">Product Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Upload Packaging Image</label>
                  <div className="relative group border-2 border-dashed border-dark/10 hover:border-primary/40 rounded-2xl p-5 bg-background hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleEditMedFile}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <MdPhotoCamera className="text-2xl text-dark/35 group-hover:text-primary/75 transition-colors mb-1.5" />
                    <p className="text-[11px] font-semibold text-dark/80 group-hover:text-primary transition-colors">Drag and drop file or click to browse</p>
                    <p className="text-[9px] text-dark/45 mt-0.5">Supports JPEG, PNG, WEBP</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 select-none">
                  <div className="h-px bg-dark/5 flex-grow"></div>
                  <span className="text-[9px] text-dark/40 uppercase font-black">OR</span>
                  <div className="h-px bg-dark/5 flex-grow"></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Image URL 1</label>
                  <input 
                    type="url" 
                    name="image_url" 
                    value={editMedData.image_url} 
                    onChange={handleEditMedChange} 
                    className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Image URL 2</label>
                  <input 
                    type="url" 
                    name="image_url_2" 
                    placeholder="Enter additional image URL"
                    value={editMedData.image_url_2} 
                    onChange={handleEditMedChange} 
                    className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Image URL 3</label>
                  <input 
                    type="url" 
                    name="image_url_3" 
                    placeholder="Enter additional image URL"
                    value={editMedData.image_url_3} 
                    onChange={handleEditMedChange} 
                    className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="md:col-span-5 flex flex-col items-center justify-center border border-dark/5 bg-background p-4 rounded-2xl min-h-[170px] w-full text-center">
                {editMedImagePreview || editMedData.image_url ? (
                  <div className="space-y-2 w-full flex flex-col items-center select-none">
                    <span className="text-[9px] text-dark/45 uppercase tracking-wider font-bold">Image Preview</span>
                    <div className="product-image-container shadow-sm">
                      <img 
                        src={editMedImagePreview || editMedData.image_url} 
                        alt="Packaging Preview" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-584017911766-6477ef9798f1?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                    {editMedImageFile && (
                      <div className="flex items-center gap-1 bg-white border border-dark/5 px-2 py-0.5 rounded-lg shadow-sm">
                        <span className="text-[9px] text-dark/70 font-semibold truncate max-w-[100px]">{editMedImageFile.name}</span>
                        <button 
                          type="button" 
                          onClick={() => { setEditMedImageFile(null); setEditMedImagePreview(null); }}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-50"
                        >
                          <MdClose className="text-xs" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-dark/35 space-y-0.5 text-center select-none">
                    <p className="text-xs font-semibold">No Image Selected</p>
                    <p className="text-[9px] leading-relaxed max-w-[150px] mx-auto">Upload a file or provide a url link to see preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-dark/5 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-grow py-3.5 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl shadow active:scale-[0.98]"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditMedModalOpen(false)}
              className="border-dark/15 text-dark hover:bg-background text-xs px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================== MODAL: ADD CATEGORY ================== */}
      <Modal 
        isOpen={addCatModalOpen} 
        onClose={() => setAddCatModalOpen(false)} 
        title="Add New Category Profile"
        size="md"
      >
        {addCatError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-semibold leading-relaxed text-left">
            <MdErrorOutline className="text-red-500 text-lg shrink-0 mt-0.5" />
            <span>{addCatError}</span>
          </div>
        )}
        {addCatSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold leading-relaxed text-left">
            <MdCheckCircle className="text-emerald-600 text-lg shrink-0 mt-0.5" />
            <span>{addCatSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAddCatSubmit} className="space-y-5 text-left">
          <div className="space-y-4">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Category Name *</label>
              <input 
                type="text" 
                value={addCatData.name} 
                onChange={(e) => setAddCatData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Skin Care"
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                required
              />
            </div>

            {/* Category Icon */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Category Symbol / Icon *</label>
              <select 
                value={addCatData.icon} 
                onChange={(e) => setAddCatData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                required
              >
                {iconList.map(icon => <option key={icon} value={icon}>{icon} Symbol</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Description Details</label>
              <textarea 
                rows="3"
                value={addCatData.description} 
                onChange={(e) => setAddCatData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description details about products that belong to this category..."
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
              />
            </div>

            {/* Subcategories (comma-separated) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Subcategories (comma-separated)</label>
              <input 
                type="text" 
                value={addCatData.subcategories} 
                onChange={(e) => setAddCatData(prev => ({ ...prev, subcategories: e.target.value }))}
                placeholder="e.g. Pain Relief, Cough & Cold, Digestion"
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
              />
            </div>

            {/* Status Option */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Status Visibility *</label>
              <select 
                value={addCatData.status} 
                onChange={(e) => setAddCatData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                required
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-dark/5 flex gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-grow py-3 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl shadow"
            >
              Create Category
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddCatModalOpen(false)}
              className="border-dark/15 text-dark hover:bg-background text-xs px-6 py-3 rounded-xl font-bold uppercase"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================== MODAL: EDIT CATEGORY ================== */}
      <Modal 
        isOpen={editCatModalOpen} 
        onClose={() => setEditCatModalOpen(false)} 
        title="Edit Category Profile"
        size="md"
      >
        {editCatError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-semibold leading-relaxed text-left">
            <MdErrorOutline className="text-red-500 text-lg shrink-0 mt-0.5" />
            <span>{editCatError}</span>
          </div>
        )}
        {editCatSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold leading-relaxed text-left">
            <MdCheckCircle className="text-emerald-600 text-lg shrink-0 mt-0.5" />
            <span>{editCatSuccess}</span>
          </div>
        )}

        <form onSubmit={handleEditCatSubmit} className="space-y-5 text-left">
          <div className="space-y-4">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Category Name *</label>
              <input 
                type="text" 
                value={editCatData.name} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                required
              />
            </div>

            {/* Category / Symbol Image URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Category / Symbol Image URL *</label>
              <input 
                type="text" 
                placeholder="Enter image URL"
                value={editCatData.icon} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Description Details</label>
              <textarea 
                rows="3"
                value={editCatData.description} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
              />
            </div>

            {/* Subcategories (comma-separated) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Subcategories (comma-separated)</label>
              <input 
                type="text" 
                value={editCatData.subcategories} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, subcategories: e.target.value }))}
                placeholder="e.g. Pain Relief, Cough & Cold, Digestion"
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
              />
            </div>

            {/* Status Option */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Status Visibility *</label>
              <select 
                value={editCatData.status} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium cursor-pointer"
                required
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-dark/5 flex gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-grow py-3 bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase tracking-wider rounded-xl shadow"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditCatModalOpen(false)}
              className="border-dark/15 text-dark hover:bg-background text-xs px-6 py-3 rounded-xl font-bold uppercase"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================== MODAL: CONFIRM COD PAYMENT ================== */}
      <Modal
        isOpen={confirmCodModalOpen}
        onClose={() => {
          setConfirmCodModalOpen(false);
          setCodOrderIdToConfirm(null);
        }}
        title="Confirm COD Payment"
        size="xs"
      >
        <div className="text-left space-y-4 select-none">
          <p className="text-xs sm:text-sm text-dark/65 leading-relaxed font-light">
            Has the customer paid the cash amount for this order?
          </p>
          <div className="flex items-center justify-end gap-3.5 pt-2">
            <Button
              onClick={() => {
                setConfirmCodModalOpen(false);
                setCodOrderIdToConfirm(null);
              }}
              variant="ghost"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-dark/10"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (codOrderIdToConfirm) {
                  await handleConfirmCodPayment(codOrderIdToConfirm);
                }
                setConfirmCodModalOpen(false);
                setCodOrderIdToConfirm(null);
              }}
              variant="primary"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================== MODAL: CONFIRM DELETE MEDICINE ================== */}
      <Modal 
        isOpen={deleteMedConfirmOpen} 
        onClose={() => setDeleteMedConfirmOpen(false)} 
        title="Delete Medicine Confirmation"
        size="sm"
      >
        <div className="space-y-5 text-center text-left">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl border border-red-100/30">
            <MdErrorOutline />
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-sm font-extrabold text-dark">Confirm Delete Product?</h4>
            <p className="text-xs text-dark/60 leading-relaxed max-w-[280px] mx-auto font-light">
              Are you sure you want to delete <span className="font-bold text-dark">"{deletingMed?.medicine_name}"</span> from the catalog database? This action is permanent.
            </p>
          </div>
          
          <div className="flex gap-2.5 pt-2">
            <button 
              onClick={handleDeleteMedConfirm}
              className="flex-grow py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow transition-colors"
            >
              Yes, Delete
            </button>
            <button 
              onClick={() => setDeleteMedConfirmOpen(false)}
              className="flex-grow py-3 bg-background hover:bg-dark/5 text-dark/65 font-bold text-xs uppercase rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ================== MODAL: CONFIRM DELETE CATEGORY ================== */}
      <Modal 
        isOpen={deleteCatConfirmOpen} 
        onClose={() => setDeleteCatConfirmOpen(false)} 
        title="Delete Category Confirmation"
        size="sm"
      >
        <div className="space-y-5 text-center text-left">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl border border-red-100/30">
            <MdErrorOutline />
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-sm font-extrabold text-dark">Confirm Delete Category?</h4>
            <p className="text-xs text-dark/60 leading-relaxed max-w-[280px] mx-auto font-light">
              Are you sure you want to delete the category <span className="font-bold text-dark">"{deletingCat?.name}"</span>?
            </p>
            <div className="p-3 bg-[#E2F3F0]/40 border border-primary/10 rounded-xl text-[10px] text-dark/75 mt-2 max-w-[300px] mx-auto text-left leading-relaxed">
              ⚠️ <span className="font-bold text-primary-dark">Note:</span> Any products currently assigned to this category will automatically be moved to the default category <span className="font-bold">"Medicines"</span>.
            </div>
          </div>
          
          <div className="flex gap-2.5 pt-2">
            <button 
              onClick={handleDeleteCatConfirm}
              className="flex-grow py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow transition-colors"
            >
              Yes, Delete
            </button>
            <button 
              onClick={() => setDeleteCatConfirmOpen(false)}
              className="flex-grow py-3 bg-background hover:bg-dark/5 text-dark/65 font-bold text-xs uppercase rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ================== MODAL: ORDER DETAILS (RECEIPT) ================== */}
      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order Details: #${selectedOrder.orderId}` : ""}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-left text-xs text-dark font-sans">
            {/* Customer & Delivery Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-dark/5">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">Customer Details</h4>
                <p className="font-bold text-sm text-dark">{selectedOrder.customerName}</p>
                <p className="text-dark/60">Email: <span className="font-semibold text-dark/80">{selectedOrder.email}</span></p>
                <p className="text-dark/60">Phone: <span className="font-semibold text-dark/80">{selectedOrder.phone}</span></p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">Delivery Address</h4>
                <p className="font-medium text-dark/80 leading-relaxed bg-background p-2.5 rounded-xl border border-dark/5">
                  {selectedOrder.deliveryAddress}
                </p>
              </div>
            </div>

            {/* Ordered Medicines / Products */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">Items Ordered</h4>
              <div className="table-responsive-container border border-dark/5 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-background border-b border-dark/5 text-[9px] uppercase font-bold text-dark/45">
                      <th className="px-4 py-2.5">Medicine / Brand</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark/5">
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-background/25">
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-dark">{item.medicine_name}</p>
                          <p className="text-[9px] text-dark/40">{item.brand}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-medium">₹{item.price}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-dark">₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dark/5">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">Fulfillment & Payment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-background p-2 rounded-xl border border-dark/5">
                    <span className="text-dark/50">Payment Method:</span>
                    <span className="font-bold text-dark">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex flex-col bg-background p-2.5 rounded-xl border border-dark/5 gap-1">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-dark/50 text-xs">Payment Status:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          selectedOrder.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30'
                            : 'bg-amber-50 text-amber-500 border border-amber-100/30'
                        }`}>
                          {selectedOrder.paymentMethod === 'COD' || selectedOrder.paymentMethod === 'Cash on Delivery (COD)'
                            ? `Payment Status: ${selectedOrder.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}`
                            : selectedOrder.paymentStatus
                          }
                        </span>
                        {(selectedOrder.paymentMethod === 'COD' || selectedOrder.paymentMethod === 'Cash on Delivery (COD)') && selectedOrder.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleRequestCodConfirmation(selectedOrder.orderId)}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-extrabold uppercase rounded transition-all cursor-pointer select-none"
                          >
                            ✓ Mark Payment as Confirmed
                          </button>
                        )}
                      </div>
                    </div>
                    {(selectedOrder.paymentMethod === 'COD' || selectedOrder.paymentMethod === 'Cash on Delivery (COD)') && selectedOrder.paymentStatus === 'Paid' && (
                      <div className="flex flex-col text-right items-end text-[10px] mt-1 border-t border-dark/5 pt-1.5 w-full leading-tight">
                        <span className="font-extrabold text-emerald-600 uppercase">✓ Payment Confirmed</span>
                        {selectedOrder.paymentConfirmedAt && (
                          <span className="text-dark/45">
                            Confirmed on: {new Date(selectedOrder.paymentConfirmedAt).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center bg-background p-2 rounded-xl border border-dark/5">
                    <span className="text-dark/50">Order Date:</span>
                    <span className="font-bold text-dark">{new Date(selectedOrder.orderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const displaySubtotal = selectedOrder.subtotal !== undefined
                  ? selectedOrder.subtotal
                  : (selectedOrder.totalAmount >= 500 ? selectedOrder.totalAmount : selectedOrder.totalAmount - 40);

                const displayDiscount = selectedOrder.discount !== undefined ? selectedOrder.discount : 0;

                const displayDeliveryFee = selectedOrder.deliveryFee !== undefined
                  ? selectedOrder.deliveryFee
                  : (selectedOrder.totalAmount >= 500 ? 0 : 40);

                return (
                  <div className="bg-background p-4 rounded-2xl border border-dark/5 flex flex-col justify-center space-y-2.5">
                    <div className="flex justify-between text-dark/60">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{displaySubtotal}</span>
                    </div>
                    {displayDiscount > 0 && (
                      <div className="flex justify-between text-secondary-dark">
                        <span>Discount</span>
                        <span className="font-semibold">-₹{displayDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-dark/60">
                      <span>Delivery Charges</span>
                      <span className="font-semibold">
                        {displayDeliveryFee > 0 ? `₹${displayDeliveryFee}` : "FREE"}
                      </span>
                    </div>
                    <div className="border-t border-dark/10 pt-2 flex justify-between items-baseline">
                      <span className="font-bold text-dark text-sm">Grand Total</span>
                      <span className="font-black text-primary text-lg">₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Return / Refund Details (Admin View) */}
            {selectedOrder.returnStatus && (
              <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-black uppercase text-amber-700 tracking-wider border-b border-amber-100 pb-1">Return / Refund Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
                  <div>
                    <span className="text-dark/50 block font-semibold">Customer Name:</span>
                    <span className="font-bold text-dark">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">Customer Email:</span>
                    <span className="font-bold text-dark">{selectedOrder.email}</span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">User ID:</span>
                    <span className="font-mono text-dark select-all">{selectedOrder.userId || "guest"}</span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">Order ID:</span>
                    <span className="font-mono font-bold text-dark select-all">{selectedOrder.orderId}</span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">Order Amount:</span>
                    <span className="font-extrabold text-primary">₹{selectedOrder.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">Requested Date/Time:</span>
                    <span className="font-bold text-dark">
                      {selectedOrder.returnRequestedAt 
                        ? new Date(selectedOrder.returnRequestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
                        : "N/A"
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">Return Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block mt-0.5 border ${
                      selectedOrder.returnStatus === 'requested'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : selectedOrder.returnStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {selectedOrder.returnStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark/50 block font-semibold">Refund Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block mt-0.5 border ${
                      selectedOrder.refundStatus === 'successful'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : selectedOrder.refundStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {selectedOrder.refundStatus || "pending"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-dark/50 block font-semibold">Return Reason:</span>
                    <p className="font-bold text-dark mt-0.5">{selectedOrder.returnReason}</p>
                  </div>
                  {(selectedOrder.returnDescription || selectedOrder.returnDetails) && (
                    <div className="md:col-span-2">
                      <span className="text-dark/50 block font-semibold">Return Description:</span>
                      <p className="font-medium text-dark/80 bg-white p-2.5 rounded-xl border border-dark/5 mt-0.5 leading-relaxed text-xs">
                        {selectedOrder.returnDescription || selectedOrder.returnDetails}
                      </p>
                    </div>
                  )}
                  {selectedOrder.returnImages && selectedOrder.returnImages.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-dark/50 block font-semibold mb-1">Uploaded Photos:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selectedOrder.returnImages.map((imgUrl, i) => (
                          <a href={imgUrl} target="_blank" rel="noreferrer" key={i} className="relative block shrink-0 border border-dark/5 rounded-lg overflow-hidden bg-background">
                            <img src={imgUrl} alt={`Return Item ${i+1}`} className="w-12 h-12 object-contain" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer-provided details for COD refunds if return is approved and not yet completed */}
                  {selectedOrder.returnStatus === 'approved' && selectedOrder.refundMethod && selectedOrder.refundStatus !== 'successful' && (
                    <div className="col-span-2 bg-background p-2.5 rounded-xl border border-dark/5 space-y-1 mt-2">
                      <p className="text-[9px] text-dark/45 font-bold uppercase tracking-wide">Customer Refund Destination ({selectedOrder.refundMethod})</p>
                      {selectedOrder.refundMethod === 'UPI' ? (
                        <p className="font-mono text-[10px] text-dark select-all">UPI ID: {selectedOrder.refundDetails?.upiId}</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-dark">
                          <p><span className="text-dark/45">Holder:</span> <strong className="font-semibold">{selectedOrder.refundDetails?.accountHolderName}</strong></p>
                          <p><span className="text-dark/45">Bank:</span> <strong className="font-semibold">{selectedOrder.refundDetails?.bankName || 'N/A'}</strong></p>
                          <p><span className="text-dark/45">Account:</span> <strong className="font-mono font-semibold select-all">
                            {selectedOrder.refundDetails?.accountNumber 
                              ? `XXXXXX${selectedOrder.refundDetails.accountNumber.slice(-4)}`
                              : 'N/A'
                            }
                          </strong></p>
                          <p><span className="text-dark/45">IFSC:</span> <strong className="font-mono font-semibold select-all">{selectedOrder.refundDetails?.ifscCode}</strong></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                 {/* Refund Action Button */}
                 <div className="pt-2.5 border-t border-amber-100/50 flex justify-end items-center gap-3">
                   {selectedOrder.returnStatus === 'requested' && selectedOrder.refundStatus !== 'Refund Successful' && selectedOrder.refundStatus !== 'successful' ? (
                     <button
                       onClick={() => handleMarkRefundSuccessful(selectedOrder.orderId)}
                       className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md select-none"
                     >
                       Refund Successful
                     </button>
                   ) : selectedOrder.refundStatus === 'Refund Successful' || selectedOrder.refundStatus === 'successful' ? (
                     <div className="text-right">
                       <span className="text-[10px] font-black text-emerald-600 uppercase block">✓ Refund Successful</span>
                       {selectedOrder.refundProcessedAt && (
                         <span className="text-[8px] text-dark/45 block">
                           Processed on: {new Date(selectedOrder.refundProcessedAt).toLocaleString('en-IN')}
                         </span>
                       )}
                     </div>
                   ) : selectedOrder.returnStatus === 'approved' && selectedOrder.refundStatus !== 'completed' && selectedOrder.refundStatus !== 'successful' && selectedOrder.refundStatus !== 'Refund Successful' ? (
                     <>
                       {(selectedOrder.paymentMethod === 'COD' || selectedOrder.paymentMethod === 'Cash on Delivery (COD)') && !selectedOrder.refundMethod ? (
                         <span className="text-[10px] text-amber-600 font-semibold italic">Waiting for customer to provide refund details</span>
                       ) : (
                         <button
                           onClick={() => handleProcessRefund(selectedOrder.orderId)}
                           className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer shadow"
                         >
                           Process Refund
                         </button>
                       )}
                     </>
                   ) : null}
                 </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => setSelectedOrder(null)}
                className="bg-primary hover:bg-primary-dark font-extrabold text-xs uppercase px-6 py-2.5 rounded-xl cursor-pointer shadow-md"
              >
                Close Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 👤 CUSTOMER DETAILS & ORDER HISTORY MODAL */}
      <Modal
        isOpen={!!viewingCustomerOrders}
        onClose={() => setViewingCustomerOrders(null)}
        title="Customer Order History"
        size="max-w-2xl"
      >
        {viewingCustomerOrders && (() => {
          const custOrders = orders.filter(o => (o.email || '').toLowerCase().trim() === viewingCustomerOrders.email.toLowerCase());
          return (
            <div className="space-y-6">
              {/* Profile Brief header */}
              <div className="flex items-center gap-4 bg-background border border-dark/5 p-4 rounded-2xl">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg select-none ${getAvatarBg(viewingCustomerOrders.name)}`}>
                  {viewingCustomerOrders.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-base font-extrabold text-dark leading-none">{viewingCustomerOrders.name}</h3>
                  <p className="text-xs text-primary font-bold mt-1.5">{viewingCustomerOrders.id} • Joined: {viewingCustomerOrders.joinedDate}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-dark/45 font-bold uppercase tracking-wider">Lifetime value</p>
                  <p className="text-lg font-black text-dark mt-0.5">₹{viewingCustomerOrders.spend.toLocaleString()}</p>
                </div>
              </div>

              {/* Grid contact */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-b border-dark/5 pb-4 text-left">
                <div>
                  <p className="text-[9px] text-dark/40 uppercase tracking-wider font-bold mb-1">Email Address</p>
                  <p className="text-dark">{viewingCustomerOrders.email}</p>
                </div>
                <div>
                  <p className="text-[9px] text-dark/40 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                  <p className="text-dark">{viewingCustomerOrders.phone}</p>
                </div>
              </div>

              {/* Order history table */}
              <div className="space-y-3 text-left">
                <h4 className="font-extrabold text-dark text-sm">System Order Records ({custOrders.length})</h4>
                <div className="table-responsive-container max-h-[300px] overflow-y-auto border border-dark/5 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-background border-b border-dark/5 text-[9px] uppercase font-bold text-dark/45">
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Order Date</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark/5 font-medium">
                      {custOrders.map(o => (
                        <tr key={o.orderId} className="hover:bg-background/25">
                          <td className="px-4 py-3.5 font-bold text-primary">{o.orderId}</td>
                          <td className="px-4 py-3.5 text-dark/65">{new Date(o.orderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                          <td className="px-4 py-3.5 text-dark max-w-[200px] truncate">
                            {o.items.map(item => `${item.medicine_name} (x${item.quantity})`).join(', ')}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-dark text-right">₹{o.totalAmount}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30' :
                              o.status === 'Cancelled' ? 'bg-red-50 text-red-500 border border-red-100/30' :
                              'bg-amber-50 text-amber-600 border border-amber-100/30'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {custOrders.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-dark/35 select-none font-medium">No order records found in the database. (Baseline value only)</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-3">
                <Button 
                  variant="outline" 
                  onClick={() => setViewingCustomerOrders(null)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold border-dark/15 hover:bg-background cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ================== MODAL: SAVE COUPON ================== */}
      <Modal 
        isOpen={couponModalOpen} 
        onClose={() => setCouponModalOpen(false)} 
        title={editingCoupon ? "Edit Promo Coupon" : "Create New Promo Coupon"}
        size="md"
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4 text-left">
          <div className="space-y-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Coupon Code *</label>
              <input 
                type="text" 
                required
                disabled={editingCoupon !== null}
                value={cpCode}
                onChange={(e) => setCpCode(e.target.value.toUpperCase())}
                placeholder="e.g. EXTRA50"
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Discount & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Discount Percentage (%) *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max="100"
                  value={cpDiscount}
                  onChange={(e) => setCpDiscount(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Expiry Date *</label>
                <input 
                  type="date" 
                  required
                  value={cpExpiryDate}
                  onChange={(e) => setCpExpiryDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Description Details *</label>
              <textarea 
                rows="2"
                required
                value={cpDescription}
                onChange={(e) => setCpDescription(e.target.value)}
                placeholder="e.g. Get 10% OFF on all diabetic medicines"
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
              />
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Minimum Order Amount (Optional)</label>
                <input 
                  type="number" 
                  value={cpMinimumOrder}
                  onChange={(e) => setCpMinimumOrder(e.target.value)}
                  placeholder="e.g. 299"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Maximum Discount Cap (Optional)</label>
                <input 
                  type="number" 
                  value={cpMaximumDiscount}
                  onChange={(e) => setCpMaximumDiscount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
                />
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Coupon Status *</label>
              <select 
                value={cpStatus}
                onChange={(e) => setCpStatus(e.target.value)}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-semibold cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-dark/5 flex gap-3">
            <button 
              type="submit"
              disabled={couponFormSaving}
              className="flex-grow py-3 bg-[#009688] hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-colors disabled:opacity-50 cursor-pointer"
            >
              {couponFormSaving ? "Saving..." : "Save Coupon"}
            </button>
            <button 
              type="button"
              onClick={() => setCouponModalOpen(false)}
              className="px-6 py-3 bg-background hover:bg-dark/5 text-dark/65 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ================== MODAL: CONFIRM DELETE COUPON ================== */}
      <Modal 
        isOpen={deleteCouponConfirmOpen} 
        onClose={() => setDeleteCouponConfirmOpen(false)} 
        title="Delete Coupon Confirmation"
        size="sm"
      >
        <div className="space-y-5 text-center text-left">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl border border-red-100/30">
            <MdErrorOutline />
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-sm font-extrabold text-dark">Confirm Delete Coupon?</h4>
            <p className="text-xs text-dark/60 leading-relaxed max-w-[280px] mx-auto font-light">
              Are you sure you want to delete coupon <span className="font-bold text-dark">"{deletingCoupon?.couponCode}"</span>? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex gap-2.5 pt-2">
            <button 
              onClick={handleDeleteCouponConfirm}
              className="flex-grow py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow transition-colors cursor-pointer"
            >
              Yes, Delete
            </button>
            <button 
              onClick={() => setDeleteCouponConfirmOpen(false)}
              className="flex-grow py-3 bg-background hover:bg-dark/5 text-dark/65 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ================== MODAL: SAVE BLOG ARTICLE ================== */}
      <Modal 
        isOpen={blogModalOpen} 
        onClose={() => setBlogModalOpen(false)} 
        title={editingBlog ? "Edit Blog Article" : "Publish New Blog Article"}
        size="lg"
      >
        <form onSubmit={handleSaveBlog} className="space-y-4 text-left">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Article Title *</label>
              <input 
                type="text" 
                required
                value={bgTitle}
                onChange={(e) => setBgTitle(e.target.value)}
                placeholder="e.g. Understanding Blood Pressure"
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-semibold"
              />
            </div>

            {/* Author & Read Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Author Name *</label>
                <input 
                  type="text" 
                  required
                  value={bgAuthor}
                  onChange={(e) => setBgAuthor(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Patel, Cardiologist"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Read Time (e.g. "5 min read")</label>
                <input 
                  type="text" 
                  value={bgReadTime}
                  onChange={(e) => setBgReadTime(e.target.value)}
                  placeholder="e.g. 5 min read"
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
                />
              </div>
            </div>

            {/* Category & Image URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Category *</label>
                <select 
                  value={bgCategory}
                  onChange={(e) => setBgCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-semibold cursor-pointer"
                >
                  <option value="Heart Health">Heart Health</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Diabetes Care">Diabetes Care</option>
                  <option value="Mental Wellness">Mental Wellness</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Image URL (Optional)</label>
                <input 
                  type="text" 
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-mono"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Brief Summary *</label>
              <textarea 
                rows="2"
                required
                value={bgSummary}
                onChange={(e) => setBgSummary(e.target.value)}
                placeholder="Brief 1-2 sentence description of the article..."
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium"
              />
            </div>

            {/* Content Body */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Full Article Content *</label>
              <textarea 
                rows="6"
                required
                value={bgContent}
                onChange={(e) => setBgContent(e.target.value)}
                placeholder="Write the full body content here..."
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:border-primary text-dark font-medium font-sans whitespace-pre-wrap"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-dark/5 flex gap-3">
            <button 
              type="submit"
              disabled={blogFormSaving}
              className="flex-grow py-3 bg-[#009688] hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-colors disabled:opacity-50 cursor-pointer"
            >
              {blogFormSaving ? "Publishing..." : editingBlog ? "Save Changes" : "Publish Article"}
            </button>
            <button 
              type="button"
              onClick={() => setBlogModalOpen(false)}
              className="px-6 py-3 bg-background hover:bg-dark/5 text-dark/65 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ================== MODAL: CONFIRM DELETE BLOG ARTICLE ================== */}
      <Modal 
        isOpen={deleteBlogConfirmOpen} 
        onClose={() => setDeleteBlogConfirmOpen(false)} 
        title="Delete Article Confirmation"
        size="sm"
      >
        <div className="space-y-5 text-center text-left">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl border border-red-100/30">
            <MdErrorOutline />
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-sm font-extrabold text-dark">Confirm Delete Article?</h4>
            <p className="text-xs text-dark/60 leading-relaxed max-w-[280px] mx-auto font-light">
              Are you sure you want to delete article <span className="font-bold text-dark">"{deletingBlog?.title}"</span>? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex gap-2.5 pt-2">
            <button 
              onClick={handleDeleteBlogConfirm}
              className="flex-grow py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow transition-colors cursor-pointer"
            >
              Yes, Delete
            </button>
            <button 
              onClick={() => setDeleteBlogConfirmOpen(false)}
              className="flex-grow py-3 bg-background hover:bg-dark/5 text-dark/65 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Dynamic Toast notifications overlay */}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-premium border flex items-center gap-2.5 text-xs font-black select-none tracking-wide transition-all duration-300 animate-toastEntrance ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 🚀 PRESCRIPTION IMAGE / PDF VIEW MODAL */}
      {selectedRx && (
        <div className="fixed inset-0 z-[110] bg-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={handleClosePrescriptionModal} />

          <div className="bg-white rounded-[24px] shadow-premium max-w-4xl w-full h-[90vh] md:h-[80vh] flex flex-col border border-dark/5 relative z-10 overflow-hidden animate-fadeIn text-left">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F8FCFC] border-b border-dark/5 flex items-center justify-between shrink-0 select-none">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-dark truncate leading-tight">{selectedRx.fileName || 'Prescription File'}</h3>
                <p className="text-[9px] text-dark/45 font-semibold mt-0.5">
                  Format: {selectedRx.fileType || 'Unknown'} | Size: {selectedRx.fileSize || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePrescriptionModal}
                className="p-1.5 hover:bg-background rounded-full text-dark/45 hover:text-red-500 transition-colors cursor-pointer"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            {/* Document display area */}
            <div className="flex-grow overflow-auto bg-[#F8FCFC]/40 flex items-center justify-center relative p-4">
              {modalLoading && !modalError && (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-20">
                  <div className="w-8 h-8 border-3 border-t-primary border-primary/20 rounded-full animate-spin"></div>
                  <span className="text-[10px] text-dark/50 font-bold mt-2.5">Fetching file content...</span>
                </div>
              )}

              {modalError && (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <MdErrorOutline className="text-red-500 text-3xl" />
                  <h4 className="font-extrabold text-dark text-xs uppercase tracking-wider">Loading Failed</h4>
                  <p className="text-[10px] text-dark/55 max-w-[280px] leading-relaxed">
                    Prescription file is unavailable or failed to load.
                  </p>
                </div>
              )}

              {!selectedRx.downloadUrl ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
                  <MdInfoOutline className="text-amber-500 text-3xl" />
                  <h4 className="font-extrabold text-dark text-xs uppercase tracking-wider">File Link Missing</h4>
                  <p className="text-[10px] text-dark/55 max-w-[280px] leading-relaxed">
                    Prescription file is unavailable.
                  </p>
                </div>
              ) : (
                <>
                  {(selectedRx.fileType?.startsWith('image/') || 
                    selectedRx.fileName?.match(/\.(jpg|jpeg|png|webp)$/i)) ? (
                    <div 
                      className="transition-transform duration-150 ease-out select-none flex items-center justify-center"
                      style={{ transform: `scale(${zoomScale})` }}
                    >
                      <img 
                        src={selectedRx.downloadUrl} 
                        alt="Prescription File"
                        className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-soft border border-dark/5 bg-white"
                        onLoad={() => setModalLoading(false)}
                        onError={() => {
                          setModalLoading(false);
                          setModalError(true);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-xl overflow-hidden border border-dark/5 bg-white">
                      <iframe 
                        src={`${selectedRx.downloadUrl}#toolbar=0`}
                        title="PDF Prescription Viewer"
                        className="w-full h-full border-0"
                        onLoad={() => setModalLoading(false)}
                        onError={() => {
                          setModalLoading(false);
                          setModalError(true);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-[#F8FCFC] border-t border-dark/5 flex flex-wrap gap-4 items-center justify-between shrink-0 select-none">
              {(selectedRx.fileType?.startsWith('image/') || 
                selectedRx.fileName?.match(/\.(jpg|jpeg|png|webp)$/i)) && selectedRx.downloadUrl ? (
                <div className="flex items-center gap-1 bg-white border border-dark/5 p-1 rounded-xl shadow-soft">
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                    title="Zoom Out"
                    className="w-7 h-7 rounded-lg text-dark/60 hover:text-primary hover:bg-background transition-colors font-extrabold text-xs cursor-pointer flex items-center justify-center"
                  >
                    －
                  </button>
                  <span className="text-[9px] font-black text-dark/60 px-1.5 min-w-[38px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                    title="Zoom In"
                    className="w-7 h-7 rounded-lg text-dark/60 hover:text-primary hover:bg-background transition-colors font-extrabold text-xs cursor-pointer flex items-center justify-center"
                  >
                    ＋
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    title="Fit to Screen"
                    className="px-2 h-7 rounded-lg text-[9px] font-black uppercase text-dark/60 hover:text-primary hover:bg-background transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Fit
                  </button>
                </div>
              ) : (
                <div />
              )}

              {selectedRx.downloadUrl && (
                <div className="flex items-center gap-2.5">
                  <a 
                    href={selectedRx.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 border border-dark/15 hover:bg-background text-dark font-extrabold text-[10px] uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(selectedRx.downloadUrl, selectedRx.fileName)}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-extrabold text-[10px] uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {/* 🚀 CUSTOMER BLOCKING CONFIRMATION MODAL */}
      {customerToBlock && (
        <div className="fixed inset-0 z-[120] bg-dark/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCustomerToBlock(null)} />
          
          <div className="bg-white rounded-[24px] shadow-premium max-w-md w-full p-6 border border-dark/5 relative z-10 flex flex-col space-y-4 text-left animate-scaleIn">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg shrink-0">
                ⚠️
              </div>
              <h3 className="text-base font-extrabold text-dark leading-tight">
                Are you sure you want to block this customer?
              </h3>
            </div>
            
            <p className="text-xs text-dark/65 leading-relaxed font-light">
              Blocking <strong>{customerToBlock.name}</strong> ({customerToBlock.email}) will permanently prevent them from logging in, checking out, or using their account. Their existing orders and profile data will be preserved.
            </p>
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToBlock(null)}
                className="flex-grow py-2.5 bg-background hover:bg-dark/5 text-dark/70 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleConfirmBlock(customerToBlock);
                  setCustomerToBlock(null);
                }}
                className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none"
              >
                Block Customer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🚀 CUSTOMER UNBLOCKING CONFIRMATION MODAL */}
      {customerToUnblock && (
        <div className="fixed inset-0 z-[120] bg-dark/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCustomerToUnblock(null)} />
          
          <div className="bg-white rounded-[24px] shadow-premium max-w-md w-full p-6 border border-dark/5 relative z-10 flex flex-col space-y-4 text-left animate-scaleIn">
            <div className="flex items-center gap-3 text-[#009688]">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#009688] flex items-center justify-center text-lg shrink-0">
                ✔️
              </div>
              <h3 className="text-base font-extrabold text-dark leading-tight">
                Are you sure you want to unblock this customer?
              </h3>
            </div>
            
            <p className="text-xs text-dark/65 leading-relaxed font-light">
              Unblocking <strong>{customerToUnblock.name}</strong> ({customerToUnblock.email}) will restore their full access to the website, allowing them to login, place orders, and manage their account.
            </p>
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToUnblock(null)}
                className="flex-grow py-2.5 bg-background hover:bg-dark/5 text-dark/70 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleConfirmUnblock(customerToUnblock);
                  setCustomerToUnblock(null);
                }}
                className="flex-grow py-2.5 bg-[#009688] hover:bg-[#00796B] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none"
              >
                Unblock Customer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
