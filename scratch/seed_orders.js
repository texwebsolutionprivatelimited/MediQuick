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

const mockOrders = [
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
    totalAmount: 125, // 30*2 + 25 + 40 (delivery fee) - 0 (discount)
    paymentMethod: "Cash on Delivery (COD)",
    paymentStatus: "Pending",
    orderDate: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
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
    totalAmount: 1129, // 130 + 999 = 1129 (free delivery since total > 500)
    paymentMethod: "UPI (Google Pay)",
    paymentStatus: "Paid",
    orderDate: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
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
    totalAmount: 400, // 180*2 + 40 = 400
    paymentMethod: "Credit / Debit Card",
    paymentStatus: "Paid",
    orderDate: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
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
    totalAmount: 475, // 145*3 + 40 = 475
    paymentMethod: "UPI (PhonePe)",
    paymentStatus: "Paid",
    orderDate: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
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
    totalAmount: 2050, // 1850 + 20*10 = 2050
    paymentMethod: "UPI (Paytm)",
    paymentStatus: "Paid",
    orderDate: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
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
    totalAmount: 160, // 24*5 + 40 = 160
    paymentMethod: "Cash on Delivery (COD)",
    paymentStatus: "Pending",
    orderDate: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    status: "Cancelled"
  }
];

async function seed() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Seeding mock orders into Firestore...");
    
    for (const order of mockOrders) {
      const orderRef = doc(db, 'orders', order.orderId);
      await setDoc(orderRef, order);
      console.log(`Seeded order ${order.orderId} successfully`);
    }
    
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding orders:", error);
  }
}

seed();
