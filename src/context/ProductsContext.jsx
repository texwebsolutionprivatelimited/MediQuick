import React, { createContext, useContext, useState, useEffect } from 'react';
import initialMedicines from '../data/medicines.json';
import initialCategories from '../data/categories.json';

const ProductsContext = createContext();

export function useProducts() {
  return useContext(ProductsContext);
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('mediquick_local_medicines');
    return saved ? JSON.parse(saved) : initialMedicines;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('mediquick_local_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [loading, setLoading] = useState(false);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem('mediquick_local_medicines', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mediquick_local_categories', JSON.stringify(categories));
  }, [categories]);

  // Image Upload helper (simulated for local state)
  const uploadImage = async (file) => {
    if (!file) return '';
    // Generate object URL for temporary local preview
    return URL.createObjectURL(file);
  };

  // --- MEDICINE CRUD ACTIONS ---

  // Add a new medicine
  const addMedicine = async (medData, imageFile = null) => {
    setLoading(true);
    try {
      let imageUrl = medData.image_url || '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const priceNum = Number(medData.price);
      const mrpNum = Number(medData.mrp || medData.price);
      const calculatedDiscount = mrpNum > priceNum 
        ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
        : 0;

      const newMed = {
        id: `med-${Date.now()}`,
        medicine_name: medData.medicine_name,
        generic_name: medData.generic_name || 'Generic Formula',
        brand: medData.brand,
        category: medData.category || 'Medicines',
        subcategory: medData.subcategory || medData.category || 'Medicines',
        strength: medData.strength || medData.dosage || 'Standard',
        form: medData.form || 'Tablet',
        pack_size: medData.pack_size || 'Pack of 1 Unit',
        price: priceNum,
        mrp: mrpNum,
        stock: Number(medData.stock || medData.stock_quantity || 0),
        prescription_required: !!medData.prescription_required,
        description: medData.description || 'No description provided.',
        manufacturer: medData.manufacturer || 'MediQuick India Ltd',
        composition: medData.composition || medData.generic_name || 'Active ingredients',
        uses: medData.uses || 'General wellness',
        image_url: imageUrl || 'https://images.unsplash.com/photo-584017911766-6477ef9798f1?auto=format&fit=crop&w=400&q=80',
        discount_percentage: calculatedDiscount,
        last_updated: new Date().toISOString()
      };

      setProducts(prev => [newMed, ...prev]);
      return newMed.id;
    } catch (e) {
      console.error("Error adding medicine:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Update a medicine
  const updateMedicine = async (id, medData, imageFile = null) => {
    setLoading(true);
    try {
      let imageUrl = medData.image_url || '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const priceNum = Number(medData.price);
      const mrpNum = Number(medData.mrp || medData.price);
      const calculatedDiscount = mrpNum > priceNum 
        ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
        : 0;

      setProducts(prev => prev.map(med => {
        if (med.id === id) {
          return {
            ...med,
            medicine_name: medData.medicine_name,
            generic_name: medData.generic_name || med.generic_name,
            brand: medData.brand || med.brand,
            category: medData.category || med.category,
            subcategory: medData.subcategory || med.subcategory,
            strength: medData.strength || medData.dosage || med.strength,
            form: medData.form || med.form,
            pack_size: medData.pack_size || med.pack_size,
            price: priceNum,
            mrp: mrpNum,
            stock: Number(medData.stock !== undefined ? medData.stock : (medData.stock_quantity !== undefined ? medData.stock_quantity : med.stock)),
            prescription_required: !!medData.prescription_required,
            description: medData.description || med.description,
            manufacturer: medData.manufacturer || med.manufacturer,
            composition: medData.composition || med.composition,
            uses: medData.uses || med.uses,
            image_url: imageUrl || med.image_url,
            discount_percentage: calculatedDiscount,
            last_updated: new Date().toISOString()
          };
        }
        return med;
      }));
      return id;
    } catch (e) {
      console.error("Error updating medicine:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Delete a medicine
  const deleteMedicine = async (id) => {
    setLoading(true);
    try {
      setProducts(prev => prev.filter(med => med.id !== id));
      return id;
    } catch (e) {
      console.error("Error deleting medicine:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };


  // --- CATEGORY CRUD ACTIONS ---

  // Add a new category
  const addCategory = async (catData) => {
    setLoading(true);
    try {
      const name = catData.name.trim();
      const description = catData.description || '';
      const icon = catData.icon || '💊';

      // Duplicate Check
      const isDuplicate = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        throw new Error("A category with this name already exists.");
      }

      const newCat = {
        id: `cat-${Date.now()}`,
        name,
        description,
        icon
      };

      setCategories(prev => [...prev, newCat]);
      return newCat.id;
    } catch (e) {
      console.error("Error adding category:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing category
  const updateCategory = async (id, catData) => {
    setLoading(true);
    try {
      const name = catData.name.trim();
      const description = catData.description || '';
      const icon = catData.icon || '💊';

      // Find old category details
      const oldCat = categories.find(cat => cat.id === id);
      if (!oldCat) {
        throw new Error("Category not found.");
      }

      // Duplicate Check (exclude current category ID)
      const isDuplicate = categories.some(cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        throw new Error("A category with this name already exists.");
      }

      // Update categories list
      setCategories(prev => prev.map(cat => {
        if (cat.id === id) {
          return { ...cat, name, description, icon };
        }
        return cat;
      }));

      // Cascade updates: Update any products using the old category name to use the new name
      if (oldCat.name !== name) {
        setProducts(prev => prev.map(med => {
          if (med.category === oldCat.name) {
            return { ...med, category: name };
          }
          return med;
        }));
      }

      return id;
    } catch (e) {
      console.error("Error updating category:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Delete a category
  const deleteCategory = async (id) => {
    setLoading(true);
    try {
      const catToDelete = categories.find(cat => cat.id === id);
      if (!catToDelete) {
        throw new Error("Category not found.");
      }

      // Filter out of categories state
      setCategories(prev => prev.filter(cat => cat.id !== id));

      // Cascade updates: Move products in the deleted category to a fallback category
      const fallbackCategory = 'Medicines';
      setProducts(prev => prev.map(med => {
        if (med.category === catToDelete.name) {
          return { ...med, category: fallbackCategory };
        }
        return med;
      }));

      return id;
    } catch (e) {
      console.error("Error deleting category:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    categories,
    loading,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addCategory,
    updateCategory,
    deleteCategory,
    isFirebaseConnected: false // Local Mock Mode
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}
