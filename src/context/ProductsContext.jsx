import React, { createContext, useContext, useState, useEffect } from 'react';
import initialMedicines from '../data/medicines.json';
import initialCategories from '../data/categories.json';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { uploadToImageKit } from '../utils/imageUpload';

const ProductsContext = createContext();

export function useProducts() {
  return useContext(ProductsContext);
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('mediquick_local_medicines');
    if (!saved) return initialMedicines;
    
    // Check for any missing preloaded products by ID and merge them into the saved list
    const parsed = JSON.parse(saved);
    const savedIds = new Set(parsed.map(p => p.id));
    const missingProducts = initialMedicines.filter(p => !savedIds.has(p.id));
    
    if (missingProducts.length > 0) {
      const merged = [...parsed, ...missingProducts];
      localStorage.setItem('mediquick_local_medicines', JSON.stringify(merged));
      return merged;
    }
    return parsed;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('mediquick_local_categories');
    if (!saved) return initialCategories;
    
    // Check if Lab Tests category exists in saved list. If not, merge it.
    const parsed = JSON.parse(saved);
    const hasLabTestCat = parsed.some(c => c.name === "Lab Tests");
    if (!hasLabTestCat) {
      const labTestCat = initialCategories.find(c => c.name === "Lab Tests");
      if (labTestCat) {
        return [...parsed, labTestCat];
      }
    }
    return parsed;
  });

  const [loading, setLoading] = useState(false);

  // Sync Categories from Firestore in Realtime
  useEffect(() => {
    if (isConfigValid && db) {
      setLoading(true);
      const categoriesRef = collection(db, 'categories');
      
      const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.categoryName || '',
            description: data.description || '',
            icon: data.categoryImage || '💊',
            subcategories: data.subCategories || [],
            status: data.isActive === false ? 'inactive' : 'active',
            displayOrder: data.displayOrder || 0
          });
        });
        
        // If Firestore is empty, seed it with default categories (including their initial subcategories)
        if (list.length === 0) {
          // Immediately populate state with defaults while seeding or if write fails
          setCategories(initialCategories);
          initialCategories.forEach(async (cat, idx) => {
            const filteredProducts = initialMedicines.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
            const subcats = Array.from(new Set(filteredProducts.map(p => p.subcategory || p.category))).sort();
            
            const docRef = doc(db, 'categories', cat.id);
            try {
              await setDoc(docRef, {
                categoryName: cat.name,
                description: cat.description || '',
                categoryImage: cat.icon || '💊',
                subCategories: subcats,
                displayOrder: idx,
                isActive: true
              });
            } catch (err) {
              console.warn("Seeding category failed (likely permission denied):", err);
            }
          });
        } else {
          // Sort categories by displayOrder or name for stable rendering order
          list.sort((a, b) => {
            if (a.displayOrder !== b.displayOrder) {
              return a.displayOrder - b.displayOrder;
            }
            return a.name.localeCompare(b.name);
          });
          setCategories(list);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to categories:", error);
        setLoading(false);
      });
      
      return unsubscribe;
    }
  }, []);

  // Sync Products from Firestore in Realtime
  useEffect(() => {
    if (isConfigValid && db) {
      setLoading(true);
      const productsRef = collection(db, 'products');
      
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            medicine_name: data.medicine_name || '',
            generic_name: data.generic_name || 'Generic Formula',
            brand: data.brand || '',
            category: data.category || '',
            subcategory: data.subcategory || '',
            strength: data.strength || '',
            form: data.form || '',
            pack_size: data.pack_size || '',
            price: Number(data.price || 0),
            mrp: Number(data.mrp || data.price || 0),
            stock: Number(data.stock !== undefined ? data.stock : 0),
            prescription_required: !!data.prescription_required,
            description: data.description || '',
            manufacturer: data.manufacturer || '',
            composition: data.composition || '',
            uses: data.uses || '',
            image_url: data.image_url || '',
            discount_percentage: Number(data.discount_percentage || 0),
            last_updated: data.last_updated || new Date().toISOString()
          });
        });
        
        // If Firestore is empty, seed it with default medicines
        if (list.length === 0) {
          setProducts(initialMedicines);
          initialMedicines.forEach(async (prod) => {
            const docRef = doc(db, 'products', prod.id);
            try {
              await setDoc(docRef, prod);
            } catch (err) {
              console.warn("Seeding product failed (likely permission denied):", err);
            }
          });
        } else {
          setProducts(list);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to products:", error);
        setLoading(false);
      });
      
      return unsubscribe;
    }
  }, []);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem('mediquick_local_medicines', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mediquick_local_categories', JSON.stringify(categories));
  }, [categories]);

  // Image Upload helper using ImageKit
  const uploadImage = async (file) => {
    if (!file) return '';
    try {
      const result = await uploadToImageKit(file, 'products');
      return result.url;
    } catch (e) {
      console.error("ImageKit upload failed:", e);
      throw e;
    }
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
        image_url: imageUrl || '/images/default-medicine.png',
        discount_percentage: calculatedDiscount,
        last_updated: new Date().toISOString()
      };

      if (isConfigValid && db) {
        await setDoc(doc(db, 'products', newMed.id), newMed);
      } else {
        setProducts(prev => [newMed, ...prev]);
      }
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

      const existing = products.find(med => med.id === id) || {};

      const updatedMed = {
        id,
        medicine_name: medData.medicine_name,
        generic_name: medData.generic_name || existing.generic_name || 'Generic Formula',
        brand: medData.brand || existing.brand,
        category: medData.category || existing.category,
        subcategory: medData.subcategory || existing.subcategory,
        strength: medData.strength || medData.dosage || existing.strength || 'Standard',
        form: medData.form || existing.form || 'Tablet',
        pack_size: medData.pack_size || existing.pack_size || 'Pack of 1 Unit',
        price: priceNum,
        mrp: mrpNum,
        stock: Number(medData.stock !== undefined ? medData.stock : (medData.stock_quantity !== undefined ? medData.stock_quantity : (existing.stock || 0))),
        prescription_required: !!medData.prescription_required,
        description: medData.description || existing.description || 'No description provided.',
        manufacturer: medData.manufacturer || existing.manufacturer || 'MediQuick India Ltd',
        composition: medData.composition || existing.composition || 'Active ingredients',
        uses: medData.uses || existing.uses || 'General wellness',
        image_url: imageUrl || existing.image_url || '/images/default-medicine.png',
        discount_percentage: calculatedDiscount,
        last_updated: new Date().toISOString()
      };

      if (isConfigValid && db) {
        await updateDoc(doc(db, 'products', id), updatedMed);
      }
      setProducts(prev => prev.map(med => med.id === id ? updatedMed : med));
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
      if (isConfigValid && db) {
        await deleteDoc(doc(db, 'products', id));
      } else {
        setProducts(prev => prev.filter(med => med.id !== id));
      }
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
      const subcategories = catData.subcategories || [];

      // Duplicate Check
      const isDuplicate = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        throw new Error("A category with this name already exists.");
      }

      const newCat = {
        categoryName: name,
        description,
        categoryImage: icon,
        subCategories: subcategories,
        displayOrder: categories.length,
        isActive: catData.status !== 'inactive'
      };

      if (isConfigValid && db) {
        const docRef = doc(collection(db, 'categories'));
        await setDoc(docRef, { ...newCat });
        return docRef.id;
      } else {
        const id = `cat-${Date.now()}`;
        const newCatWithId = { 
          id, 
          name, 
          description, 
          icon, 
          subcategories, 
          status: catData.status || 'active',
          displayOrder: categories.length
        };
        setCategories(prev => [...prev, newCatWithId]);
        return id;
      }
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

      const payload = {
        categoryName: name,
        description,
        categoryImage: icon,
        subCategories: catData.subcategories || oldCat.subcategories || [],
        displayOrder: catData.displayOrder !== undefined ? catData.displayOrder : (oldCat.displayOrder || 0),
        isActive: catData.status !== 'inactive'
      };

      if (isConfigValid && db) {
        await updateDoc(doc(db, 'categories', id), payload);
      } else {
        setCategories(prev => prev.map(cat => {
          if (cat.id === id) {
            return { 
              ...cat, 
              name, 
              description, 
              icon, 
              subcategories: payload.subCategories,
              status: catData.status || 'active',
              displayOrder: payload.displayOrder
            };
          }
          return cat;
        }));
      }

      // Cascade updates: Update any products using the old category name to use the new name
      if (oldCat.name !== name) {
        if (isConfigValid && db) {
          const affectedProducts = products.filter(med => med.category === oldCat.name);
          for (const med of affectedProducts) {
            await updateDoc(doc(db, 'products', med.id), { category: name });
          }
        } else {
          setProducts(prev => prev.map(med => {
            if (med.category === oldCat.name) {
              return { ...med, category: name };
            }
            return med;
          }));
        }
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

      const fallbackCategory = 'Medicines';
      if (isConfigValid && db) {
        await deleteDoc(doc(db, 'categories', id));
        const affectedProducts = products.filter(med => med.category === catToDelete.name);
        for (const med of affectedProducts) {
          await updateDoc(doc(db, 'products', med.id), { category: fallbackCategory });
        }
      } else {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        setProducts(prev => prev.map(med => {
          if (med.category === catToDelete.name) {
            return { ...med, category: fallbackCategory };
          }
          return med;
        }));
      }

      return id;
    } catch (e) {
      console.error("Error deleting category:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateProductStats = async (productId, averageRating, reviewCount) => {
    if (isConfigValid && db) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          averageRating: Number(averageRating),
          reviewCount: Number(reviewCount)
        });
      } catch (err) {
        console.warn("Failed to update product stats in Firestore:", err);
      }
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, averageRating: Number(averageRating), reviewCount: Number(reviewCount) }
          : p
      )
    );
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
    updateProductStats,
    isFirebaseConnected: !!(isConfigValid && db)
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}
