import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, doc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
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
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

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
          
          // Auto-seed missing default articles to Firestore if any are absent
          const existingIds = new Set(list.map(a => a.id));
          defaultArticles.forEach(async (art) => {
            if (!existingIds.has(art.id)) {
              try {
                await setDoc(doc(db, 'blogs', art.id), art);
                console.log(`Auto-seeded missing blog to Firestore: ${art.title}`);
              } catch (e) {
                console.error("Auto-seeding blog failed:", e);
              }
            }
          });
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
        setArticles(parsed);
      } else {
        setArticles(defaultArticles);
        localStorage.setItem('mediquick_local_blogs', JSON.stringify(defaultArticles));
      }
      setLoading(false);
    }
  }, []);

  // Reset showAll state when selected category or search query changes
  useEffect(() => {
    setShowAll(false);
  }, [selectedCategory, searchQuery]);

  // Filter articles based on category and search query
  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return articles.filter(art => {
      if (query !== "") {
        const titleMatch = art.title?.toLowerCase().includes(query) || false;
        const descMatch = art.description?.toLowerCase().includes(query) || false;
        const categoryMatch = art.category?.toLowerCase().includes(query) || false;
        const contentMatch = art.content?.toLowerCase().includes(query) || false;
        const summaryMatch = art.summary?.toLowerCase().includes(query) || false;
        
        return titleMatch || descMatch || categoryMatch || contentMatch || summaryMatch;
      }
      return selectedCategory === "All" || art.category === selectedCategory;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Show sliced preview (first 4 articles) by default
  const visibleArticles = useMemo(() => {
    if (showAll) {
      return filteredArticles;
    }
    return filteredArticles.slice(0, 4);
  }, [filteredArticles, showAll]);

  // Handle click outside of search container to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter and score suggestions for search dropdown
  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") return [];

    const scored = articles.map(art => {
      let score = 0;
      const titleLower = art.title?.toLowerCase() || "";
      const descLower = art.description?.toLowerCase() || "";
      const catLower = art.category?.toLowerCase() || "";
      const contentLower = art.content?.toLowerCase() || "";
      const summaryLower = art.summary?.toLowerCase() || "";

      // Prioritize exact and partial title matches
      if (titleLower === query) {
        score += 100;
      } else if (titleLower.startsWith(query)) {
        score += 80;
      } else if (titleLower.includes(query)) {
        score += 60;
      }

      // Prioritize category matches next
      if (catLower === query) {
        score += 50;
      } else if (catLower.includes(query)) {
        score += 40;
      }

      // Muted match values for description/summary/content
      if (descLower.includes(query)) {
        score += 20;
      }
      if (summaryLower.includes(query)) {
        score += 20;
      }
      if (contentLower.includes(query)) {
        score += 10;
      }

      return { article: art, score };
    }).filter(item => item.score > 0);

    // Sort by descending score, fallback to title alphabetical sorting
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.article.title.localeCompare(b.article.title);
    });

    return scored.map(item => item.article);
  }, [articles, searchQuery]);

  // Reset activeIndex when search query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  // Handle keyboard navigation inside search input
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        const selectedArt = suggestions[activeIndex];
        navigate(`/blogs/${selectedArt.id}`);
        setShowDropdown(false);
        setSearchQuery("");
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="bg-[#F8FCFC] min-h-screen pt-5 pb-12 font-sans text-dark/95 text-left relative">
      <div className="container mx-auto px-4 max-w-7xl xl:max-w-[1440px]">
        
        {/* Back Link */}
        <div className="mb-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:underline transition-all">
            <MdArrowBack className="text-sm" /> Back to Home Page
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
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
          <div ref={searchContainerRef} className="relative w-full md:max-w-xs shrink-0 select-none">
            <input 
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white border border-dark/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-light focus-ring"
            />
            <MdSearch 
              className="absolute left-3.5 text-dark/45 text-base" 
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
                className="absolute right-3.5 text-dark/45 hover:text-dark text-base cursor-pointer bg-transparent border-none outline-none p-0 flex items-center justify-center"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              >
                <MdClose />
              </button>
            )}

            {/* Dropdown panel */}
            {showDropdown && searchQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-dark/10 rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto select-none">
                {suggestions.length > 0 ? (
                  suggestions.map((art, idx) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        navigate(`/blogs/${art.id}`);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`px-4 py-3 border-b border-dark/5 last:border-none cursor-pointer text-left transition-colors ${
                        activeIndex === idx ? "bg-primary/5" : "hover:bg-primary/5"
                      }`}
                    >
                      <p className="text-xs font-bold text-dark line-clamp-1">
                        {art.title}
                      </p>
                      <p className="text-[10px] text-dark/50 mt-0.5">
                        {art.category} &bull; {art.readTime}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-bold text-[#063B44] mb-1">No articles found</p>
                    <p className="text-[10px] text-dark/50 font-light">Try searching with a different keyword.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8 select-none">
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

        {selectedCategory !== "All" && searchQuery.trim() === "" && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-dark/5 pb-3.5 select-none">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#063B44] leading-tight">
              {selectedCategory}
            </h2>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
          {visibleArticles.map((art) => (
            <motion.div 
              key={art.id}
              layoutId={`article-card-${art.id}`}
              onClick={() => navigate(`/blogs/${art.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/blogs/${art.id}`);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${art.title}`}
              className="group bg-white border border-dark/5 rounded-2xl sm:rounded-[32px] overflow-hidden shadow-soft hover:shadow-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[320px] sm:min-h-[420px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {/* Cover Image */}
              <div className="h-32 sm:h-48 overflow-hidden relative select-none shrink-0">
                <img 
                  src={art.image} 
                  alt={art.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm text-primary-dark font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {art.category}
                </span>
              </div>

              {/* Body */}
              <div className="p-3.5 sm:p-6 flex-grow flex flex-col justify-between space-y-2.5 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] sm:text-[10px] text-dark/40 font-bold uppercase tracking-wider select-none">
                    <span className="flex items-center gap-1"><MdCalendarToday className="text-primary text-xs" /> {art.date}</span>
                    <span className="flex items-center gap-1"><MdAccessTime className="text-primary text-xs" /> {art.readTime}</span>
                  </div>
                  <h3 className="font-extrabold text-dark group-hover:text-primary transition-colors text-sm sm:text-lg line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-dark/65 font-light leading-relaxed line-clamp-2">
                    {art.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-1 border-t border-dark/5 pt-3 sm:pt-4 mt-auto">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-dark/60 font-medium select-none truncate max-w-[80px] sm:max-w-[180px]">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-[9px] sm:text-[10px] uppercase">
                      {art.author.replace("Dr. ", "").charAt(0)}
                    </div>
                    <span className="truncate">{art.author}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/blogs/${art.id}`);
                    }}
                    tabIndex={-1}
                    className="text-[10px] sm:text-xs font-black text-primary hover:text-primary-dark hover:underline uppercase tracking-wide shrink-0 cursor-pointer flex items-center gap-0.5 bg-transparent border-none outline-none"
                  >
                    Read Full Article →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredArticles.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white border border-dark/5 rounded-[32px] shadow-soft flex flex-col items-center justify-center select-none">
              <p className="text-base font-extrabold text-[#063B44] mb-2">No articles found</p>
              <p className="text-xs text-dark/50 font-light">Try searching with a different keyword.</p>
            </div>
          )}
        </div>

        {filteredArticles.length > 4 && (
          <div className="flex justify-center mt-8 sm:mt-12 mb-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 sm:px-8 sm:py-3.5 bg-primary hover:bg-primary-dark border border-primary text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-soft hover:shadow-premium cursor-pointer outline-none"
            >
              {showAll ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
