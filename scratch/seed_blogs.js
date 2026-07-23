import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    config[key] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
  measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
};

const defaultArticles = [
  {
    id: "blog-1",
    title: "Understanding Blood Pressure: The Silent Indicator",
    category: "Heart Health",
    readTime: "5 min read",
    author: "Dr. Ramesh Patel, Cardiologist",
    date: "July 12, 2026",
    summary: "What systolic and diastolic pressure numbers actually mean for your cardiovascular health and dynamic daily wellness.",
    image: "https://images.unsplash.com/photo-1613243555011-5781fa7dec51?auto=format&fit=crop&w=600&q=80",
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

async function seedBlogs() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Clearing existing blogs in Firestore...");
    const blogsCol = collection(db, 'blogs');
    const snapshot = await getDocs(blogsCol);
    
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    console.log(`Cleared ${snapshot.size} existing blogs.`);
    
    console.log("Seeding default blogs...");
    for (const article of defaultArticles) {
      const docRef = doc(db, 'blogs', article.id);
      await setDoc(docRef, article);
      console.log(`Seeded blog: ${article.title}`);
    }
    
    console.log("Blogs seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding blogs:", error);
  }
}

seedBlogs();
