import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { useProducts } from '../context/ProductsContext';

export default function Categories() {
  const { products, categories } = useProducts();
  
  // Calculate dynamic product counts per category
  const categoriesWithCounts = categories.map(cat => {
    const count = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
    return {
      name: cat.name,
      icon: cat.icon || '💊',
      desc: cat.description || 'No description provided.',
      count
    };
  });

  return (
    <div className="bg-[#F8FCFC] min-h-screen pb-16 font-sans text-dark/95 text-left">
      
      {/* 🚀 PAGE HEADER */}
      <section className="bg-white py-10 border-b border-dark/5 shadow-soft">
        <div className="container mx-auto px-4">
          <span className="text-[10px] font-black uppercase text-primary-dark tracking-wider">Browse Catalog</span>
          <h1 className="text-3xl font-extrabold text-dark mt-1">Shop by Category</h1>
          <p className="text-xs text-dark/50 mt-1 max-w-md font-light leading-relaxed">
            Browse through our wide range of wellness categories. Everything you need is verified and ready for local delivery.
          </p>
        </div>
      </section>

      {/* 📦 GRID LAYOUT */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 min-[576px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {categoriesWithCounts.map((cat, idx) => (
            <Link key={idx} to={`/medicines?category=${encodeURIComponent(cat.name)}`}>
              <Card 
                hoverable={true} 
                padding="p-6" 
                className="bg-white border border-dark/5 shadow-soft flex flex-col justify-between h-full min-h-[12rem] cursor-pointer relative overflow-hidden"
              >
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-primary/5 text-primary text-xl flex items-center justify-center shadow-sm">
                      {cat.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-dark text-sm sm:text-base hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block mt-0.5">
                        {cat.count} Products available
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-dark/60 leading-relaxed font-light line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-extrabold text-primary uppercase tracking-wide mt-4 select-none">
                  Explore category <MdKeyboardArrowRight className="text-base" />
                </div>

              </Card>
            </Link>
          ))}

        </div>
      </div>

    </div>
  );
}
