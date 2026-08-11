import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  MdArrowBack, 
  MdAccessTime, 
  MdPerson, 
  MdCalendarToday,
  MdBookmarkBorder,
  MdCheckCircle
} from 'react-icons/md';

export default function BlogDetails() {
  const { id } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top on component load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

  useEffect(() => {
    if (isConfigValid && db) {
      setLoading(true);
      const blogsRef = collection(db, 'blogs');
      const q = query(blogsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id });
        });
        if (list.length === 0) {
          setArticles(defaultArticles);
        } else {
          setArticles(list);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to blogs in BlogDetails:", error);
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

  const article = articles.find(art => art.id === id);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-[#F8FCFC]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/95 text-left">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-red-500">Article Not Found</h2>
          <p className="text-dark/60 font-light">The blog article you are looking for does not exist.</p>
          <div className="pt-4">
            <Link to="/blogs" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
              <MdArrowBack className="text-sm" /> Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FCFC] min-h-screen py-12 font-sans text-dark/95 text-left">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/blogs" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Blogs
          </Link>
        </div>

        {/* Article Details Wrapper */}
        <div className="bg-white rounded-[32px] border border-dark/5 shadow-soft p-6 sm:p-10 space-y-6">
          {/* Header Info */}
          <div className="space-y-3">
            <span className="bg-primary/10 text-primary-dark font-extrabold uppercase text-[10px] px-2.5 py-1 rounded-md tracking-wider inline-block">
              {article.category}
            </span>
            
            <h1 className="text-2xl sm:text-3.5xl font-extrabold text-[#063B44] leading-snug">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-dark/45 font-bold uppercase tracking-wide">
              <span className="flex items-center gap-1"><MdCalendarToday className="text-primary text-sm" /> {article.date}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1"><MdAccessTime className="text-primary text-sm" /> {article.readTime}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1"><MdPerson className="text-primary text-base" /> Written by {article.author}</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="h-64 sm:h-96 rounded-2xl overflow-hidden shadow-inner select-none">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Complete Article Content */}
          <div className="text-xs sm:text-sm text-dark/80 font-light leading-relaxed whitespace-pre-line space-y-4">
            {article.content}
          </div>

          {/* Checklist Commitment Box */}
          <div className="p-6 bg-primary/5 rounded-[24px] border border-primary/10 space-y-3">
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

      </div>
    </div>
  );
}
