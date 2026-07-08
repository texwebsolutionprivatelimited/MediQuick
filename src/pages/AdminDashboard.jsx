import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import MedicineImage from '../components/MedicineImage';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, doc, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
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
  MdReceipt
} from 'react-icons/md';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { 
    products, 
    categories, 
    addMedicine, 
    updateMedicine, 
    deleteMedicine,
    addCategory,
    updateCategory,
    deleteCategory 
  } = useProducts();



  // Navigation Module Tab: 'overview' | 'medicines' | 'categories'
  const [activeTab, setActiveTab] = useState('overview');

  // --- ORDERS TAB STATES & ACTIONS ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearchVal, setOrderSearchVal] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
    }
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      const userId = order?.userId;

      if (isConfigValid && db) {
        // Update in root orders collection (for Admin Console)
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });

        // Update in user subcollection (for user-side tracking)
        if (userId && userId !== 'guest') {
          const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userOrderRef, { status: newStatus }).catch(err => {
            console.warn("Could not sync user orders subcollection status (document might not exist):", err);
          });
        }
      } else {
        const updated = orders.map(ord => 
          ord.orderId === orderId ? { ...ord, status: newStatus } : ord
        );
        setOrders(updated);
        localStorage.setItem('mediquick_local_orders', JSON.stringify(updated));
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
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
    image_url: ''
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
    icon: '💊'
  });
  const [addCatError, setAddCatError] = useState(null);
  const [addCatSuccess, setAddCatSuccess] = useState(null);

  // Edit Category State
  const [editCatModalOpen, setEditCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({
    name: '',
    description: '',
    icon: '💊'
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
  };

  const handleEditMedChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditMedData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddMedFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAddMedError("Please select a valid image file.");
        return;
      }
      setAddMedImageFile(file);
      setAddMedImagePreview(URL.createObjectURL(file));
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
      setEditMedImagePreview(URL.createObjectURL(file));
      setEditMedError(null);
    }
  };

  // --- SUBMIT HANDLERS ---
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
      const newId = await addCategory(addCatData);
      setAddCatSuccess(`Category created successfully with ID: ${newId}`);
      setTimeout(() => {
        setAddCatModalOpen(false);
        setAddCatData({ name: '', description: '', icon: '💊' });
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
      await updateCategory(editingCatId, editCatData);
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
      image_url: med.image_url || ''
    });
    setEditMedImagePreview(med.image_url);
    setEditMedModalOpen(true);
  };

  const startEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditCatData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '💊'
    });
    setEditCatModalOpen(true);
  };



  // --- STATS COMPUTATIONS (Overview) ---
  const totalMeds = products.length;
  const totalCats = categories.length;
  const lowStockMeds = products.filter(p => p.stock > 0 && p.stock < 10);
  const outOfStockMeds = products.filter(p => p.stock === 0);
  const recentMeds = [...products].sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated)).slice(0, 5);

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

  return (
    <div className="bg-[#F8FCFC] min-h-screen font-sans text-dark/90 text-left flex flex-col md:flex-row">
      
      {/* 🛡️ SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r border-dark/5 flex flex-col select-none shrink-0">
        {/* Brand Banner */}
        <div className="p-6 border-b border-dark/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm">M</span>
            <div>
              <h2 className="font-extrabold text-dark text-sm sm:text-base leading-none">MediQuick</h2>
              <span className="text-[9px] text-primary font-black uppercase tracking-wider block mt-0.5">Admin Console</span>
            </div>
          </div>
        </div>

        {/* User profile capsule */}
        <div className="p-4 mx-4 my-4 bg-background border border-dark/5 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {currentUser.displayName ? currentUser.displayName.slice(0, 2) : 'AD'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-dark truncate leading-none">{currentUser.displayName || 'Admin User'}</p>
            <p className="text-[10px] text-dark/45 truncate mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        {/* Tab links */}
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => { setActiveTab('overview'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-md' : 'text-dark/60 hover:bg-background hover:text-dark'}`}
          >
            <MdDashboard className="text-lg" /> Dashboard Overview
          </button>
          
          <button 
            onClick={() => { setActiveTab('medicines'); setMedCurrentPage(1); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${activeTab === 'medicines' ? 'bg-primary text-white shadow-md' : 'text-dark/60 hover:bg-background hover:text-dark'}`}
          >
            <MdLocalPharmacy className="text-lg" /> Manage Medicines
          </button>
          
          <button 
            onClick={() => { setActiveTab('categories'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${activeTab === 'categories' ? 'bg-primary text-white shadow-md' : 'text-dark/60 hover:bg-background hover:text-dark'}`}
          >
            <MdCategory className="text-lg" /> Manage Categories
          </button>

          <button 
            onClick={() => { setActiveTab('orders'); setOrderCurrentPage(1); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-md' : 'text-dark/60 hover:bg-background hover:text-dark'}`}
          >
            <MdReceipt className="text-lg" /> Manage Orders
          </button>
        </nav>

        {/* Back to shop and logout buttons */}
        <div className="p-4 border-t border-dark/5 space-y-2">
          <Button 
            variant="outline" 
            icon={MdArrowBack} 
            onClick={() => navigate('/')}
            className="w-full border-dark/15 text-dark hover:bg-background text-xs py-2.5 rounded-xl cursor-pointer"
          >
            Back to Shop
          </Button>
          
          <button
            onClick={async () => {
              navigate('/', { replace: true });
              await logout();
            }}
            className="w-full py-2.5 hover:bg-red-50 text-red-500 hover:text-red-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-transparent hover:border-red-200/50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MdClose className="text-sm" strokeWidth="1" />
            Admin Logout
          </button>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-dark/5 px-6 py-4 flex items-center justify-between select-none">
          <div>
            <h1 className="text-lg font-black text-dark tracking-tight">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'medicines' && 'Medicine Inventory Management'}
              {activeTab === 'categories' && 'Store Categories Catalog'}
              {activeTab === 'orders' && 'Order Management & Fulfillment'}
            </h1>
            <p className="text-[10px] text-dark/45 font-medium leading-none mt-0.5">Control panel database console</p>
          </div>
          
          <div className="flex items-center gap-2">
            {!isConfigValid && (
              <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md">
                ⚡ Local Mock Mode
              </span>
            )}
          </div>
        </header>

        {/* TAB WORKSPACES */}
        <div className="p-6 md:p-8 flex-grow">
          
          {/* ================== MODULE 1: DASHBOARD OVERVIEW ================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Counter Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
                <Card hoverable={false} padding="p-5" className="bg-white border border-dark/5 shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    <MdLocalPharmacy />
                  </div>
                  <div>
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block">Total Medicines</span>
                    <h3 className="text-xl font-black text-dark mt-0.5">{totalMeds} Products</h3>
                  </div>
                </Card>

                <Card hoverable={false} padding="p-5" className="bg-white border border-dark/5 shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-blue-100/30">
                    <MdCategory />
                  </div>
                  <div>
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block">Total Categories</span>
                    <h3 className="text-xl font-black text-dark mt-0.5">{totalCats} Classes</h3>
                  </div>
                </Card>

                <Card hoverable={false} padding="p-5" className="bg-white border border-dark/5 shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-amber-100/30">
                    <MdInfoOutline />
                  </div>
                  <div>
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block">Low Stock Products</span>
                    <h3 className="text-xl font-black text-dark mt-0.5">{lowStockMeds.length} items</h3>
                  </div>
                </Card>

                <Card hoverable={false} padding="p-5" className="bg-white border border-dark/5 shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-red-100/30">
                    <MdErrorOutline />
                  </div>
                  <div>
                    <span className="text-[10px] text-dark/45 font-bold uppercase tracking-wider block">Out of Stock</span>
                    <h3 className="text-xl font-black text-dark mt-0.5">{outOfStockMeds.length} items</h3>
                  </div>
                </Card>
              </div>

              {/* Recent Medicines and Fast Stocks overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Recent Products Table */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-dark/5 pb-3">
                    <h3 className="font-extrabold text-dark text-sm sm:text-base">Recent Medicines Added</h3>
                    <button 
                      onClick={() => setActiveTab('medicines')} 
                      className="text-primary hover:underline text-xs font-bold"
                    >
                      View All
                    </button>
                  </div>
                  
                  <Card hoverable={false} padding="p-0" className="bg-white border border-dark/5 shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
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
                <div className="overflow-x-auto">
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-background border-b border-dark/5 text-left text-[10px] uppercase font-black text-dark/45 select-none">
                        <th className="px-6 py-4 w-20 text-center">Icon</th>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-center">Mapped Products</th>
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
                              <span className="w-10 h-10 rounded-xl bg-primary/5 text-primary text-xl flex items-center justify-center mx-auto shadow-sm">
                                {cat.icon || '💊'}
                              </span>
                            </td>

                            {/* Name */}
                            <td className="px-6 py-4 font-bold text-dark">{cat.name}</td>

                            {/* Description */}
                            <td className="px-6 py-4 text-dark/60 max-w-xs truncate">{cat.description || 'No description provided.'}</td>

                            {/* Count */}
                            <td className="px-6 py-4 text-center select-none font-bold text-dark/75">
                              {productCount} items
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
                  <div className="overflow-x-auto">
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
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mt-1 ${
                                  order.paymentStatus === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30'
                                    : 'bg-amber-50 text-amber-500 border border-amber-100/30'
                                }`}>
                                  {order.paymentStatus}
                                </span>
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
                                  className={`px-3 py-1.5 border border-dark/5 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-sm transition-all ${badgeStyle}`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
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
                    <div className="w-24 h-24 overflow-hidden bg-white border border-dark/5 rounded-xl flex items-center justify-center p-1 shadow-sm">
                      <img 
                        src={addMedImagePreview || addMedData.image_url} 
                        alt="Packaging Preview" 
                        className="w-full h-full object-contain"
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
                  <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Direct Image URL Link</label>
                  <input 
                    type="url" 
                    name="image_url" 
                    value={editMedData.image_url} 
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
                    <div className="w-24 h-24 overflow-hidden bg-white border border-dark/5 rounded-xl flex items-center justify-center p-1 shadow-sm">
                      <img 
                        src={editMedImagePreview || editMedData.image_url} 
                        alt="Packaging Preview" 
                        className="w-full h-full object-contain"
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

            {/* Category Icon */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark/65 uppercase tracking-wide">Category Symbol / Icon *</label>
              <select 
                value={editCatData.icon} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, icon: e.target.value }))}
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
                value={editCatData.description} 
                onChange={(e) => setEditCatData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full text-xs px-3.5 py-3 bg-background border border-dark/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium"
              />
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
              <div className="border border-dark/5 rounded-2xl overflow-hidden bg-white">
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
                  <div className="flex justify-between items-center bg-background p-2 rounded-xl border border-dark/5">
                    <span className="text-dark/50">Payment Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedOrder.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/30'
                        : 'bg-amber-50 text-amber-500 border border-amber-100/30'
                    }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-background p-2 rounded-xl border border-dark/5">
                    <span className="text-dark/50">Order Date:</span>
                    <span className="font-bold text-dark">{new Date(selectedOrder.orderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-background p-4 rounded-2xl border border-dark/5 flex flex-col justify-center space-y-2.5">
                <div className="flex justify-between text-dark/60">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{selectedOrder.totalAmount >= 500 ? selectedOrder.totalAmount : selectedOrder.totalAmount - 40}</span>
                </div>
                {selectedOrder.totalAmount < 500 && (
                  <div className="flex justify-between text-dark/60">
                    <span>Delivery Charges</span>
                    <span className="font-semibold">₹40</span>
                  </div>
                )}
                <div className="border-t border-dark/10 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-dark text-sm">Grand Total</span>
                  <span className="font-black text-primary text-lg">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>

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

    </div>
  );
}
