import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  MdArrowBack, 
  MdSearch, 
  MdAccessTime, 
  MdClose, 
  MdPerson, 
  MdCalendarToday,
  MdBookmarkBorder,
  MdCheckCircle
} from 'react-icons/md';

export default function Blogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeArticle, setActiveArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Heart Health", "Nutrition", "Diabetes Care", "Mental Wellness"];

  // Sync Blogs from Firestore / LocalStorage / hardcoded defaults
  useEffect(() => {
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
3. **Manage Chronic Stress**: Implement mindfulness, breathing routines, or cognitive relaxation.
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
      }
    ];

    if (isConfigValid && db) {
      setLoading(true);
      const blogsRef = collection(db, 'blogs');
      const q = query(blogsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id });
        });
        // If Firestore is empty, seed defaults
        if (list.length === 0) {
          setArticles(defaultArticles);
        } else {
          setArticles(list);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to blogs:", error);
        setArticles(defaultArticles);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      setLoading(true);
      const savedBlogs = localStorage.getItem('mediquick_local_blogs');
      if (savedBlogs) {
        setArticles(JSON.parse(savedBlogs));
      } else {
        setArticles(defaultArticles);
        localStorage.setItem('mediquick_local_blogs', JSON.stringify(defaultArticles));
      }
      setLoading(false);
    }
  }, []);

  // Filter articles based on category and search query
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            art.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/95 text-left relative">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider">
              Health Blogs & Guides
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063B44] leading-tight">
              MediQuick <span className="text-primary">Wellness Library</span>
            </h1>
            <p className="text-sm text-dark/50 max-w-xl font-light">
              Read verified articles on heart care, fitness, nutrition, and diabetes management curated by medical experts.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs shrink-0 select-none">
            <input 
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-dark/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-light focus-ring"
            />
            <MdSearch className="absolute left-3.5 top-3.5 text-dark/45 text-base" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2.5 mb-10 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all border ${
                selectedCategory === cat 
                  ? "bg-primary text-white border-primary shadow-sm" 
                  : "bg-white text-dark/65 border-dark/10 hover:border-primary/45"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 min-[576px]:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((art) => (
            <motion.div 
              key={art.id}
              layoutId={`article-card-${art.id}`}
              className="group bg-white border border-dark/5 rounded-[32px] overflow-hidden shadow-soft hover:shadow-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[420px]"
            >
              {/* Cover Image */}
              <div className="h-48 overflow-hidden relative select-none shrink-0">
                <img 
                  src={art.image} 
                  alt={art.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary-dark font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {art.category}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-4 text-[10px] text-dark/40 font-bold uppercase tracking-wider select-none">
                    <span className="flex items-center gap-1"><MdCalendarToday className="text-primary text-xs" /> {art.date}</span>
                    <span className="flex items-center gap-1"><MdAccessTime className="text-primary text-xs" /> {art.readTime}</span>
                  </div>
                  <h3 className="font-extrabold text-dark group-hover:text-primary transition-colors text-base sm:text-lg line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-dark/65 font-light leading-relaxed line-clamp-2">
                    {art.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-dark/5 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-dark/60 font-medium select-none truncate max-w-[180px]">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-[10px] uppercase">
                      {art.author.replace("Dr. ", "").charAt(0)}
                    </div>
                    <span className="truncate">{art.author}</span>
                  </div>
                  <button
                    onClick={() => setActiveArticle(art)}
                    className="text-xs font-black text-primary hover:text-primary-dark hover:underline uppercase tracking-wide shrink-0 cursor-pointer flex items-center gap-0.5 bg-transparent border-none outline-none"
                  >
                    Read Full Article →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredArticles.length === 0 && (
            <div className="col-span-2 text-center py-16 bg-white border border-dark/5 rounded-[32px] shadow-soft">
              <p className="text-sm text-dark/50 font-light">No articles found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal reading view */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-2xl shadow-premium overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-dark/5 flex items-center justify-between bg-[#F8FCFC]">
                <div className="space-y-1">
                  <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[9px] px-2 py-0.5 rounded-full tracking-wider">
                    {activeArticle.category}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-dark/45 font-bold uppercase tracking-wide pt-1">
                    <span>{activeArticle.date}</span>
                    <span>•</span>
                    <span>{activeArticle.readTime}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="text-dark/55 hover:text-red-500 rounded-full hover:bg-background p-1.5 transition-colors"
                >
                  <MdClose className="text-2xl" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-grow">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#063B44] leading-snug">
                  {activeArticle.title}
                </h2>
                
                <div className="flex items-center gap-2 text-xs text-dark/50 font-semibold select-none">
                  <MdPerson className="text-primary text-base" /> Written by {activeArticle.author}
                </div>

                <div className="h-56 rounded-2xl overflow-hidden shadow-inner select-none">
                  <img src={activeArticle.image} alt={activeArticle.title} className="w-full h-full object-cover" />
                </div>

                {/* Article Body */}
                <div className="text-xs sm:text-sm text-dark/80 font-light leading-relaxed whitespace-pre-line space-y-4">
                  {activeArticle.content}
                </div>

                {/* Checklist Commitment Box */}
                <div className="p-5 bg-primary/5 rounded-[24px] border border-primary/10 space-y-3">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#063B44] flex items-center gap-1.5">
                    <MdBookmarkBorder className="text-primary text-lg" /> Health Action Takeaway:
                  </h4>
                  <ul className="text-xs text-dark/75 space-y-2">
                    <li className="flex items-start gap-2">
                      <MdCheckCircle className="text-secondary text-base shrink-0 mt-0.5" />
                      <span>Regular monitoring and doctor checkups form the core of prevention.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MdCheckCircle className="text-secondary text-base shrink-0 mt-0.5" />
                      <span>Small, consistent dietary adjustments outperform temporary diets.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
