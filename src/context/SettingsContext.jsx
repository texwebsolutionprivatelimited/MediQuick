import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isConfigValid } from '../firebase/firebase';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

const DEFAULT_SYSTEM_SETTINGS = {
  storeOpen: true,
  supportPhone: "+1 (555) 019-2834",
  supportEmail: "support@mediquick.com",
  operatingHours: "24/7, 365 Days",
  enableNotifications: true,
  maintenanceMode: false
};

const DEFAULT_DELIVERY_SETTINGS = {
  baseDeliveryFee: 40,
  freeDeliveryThreshold: 500,
  hubLatitude: 17.4230, // Gachibowli, Hyderabad as default
  hubLongitude: 78.3460,
  priorityRadius: 5.0, // in KM
  maximumServiceRadius: 15.0, // in KM
  priorityDeliveryTime: "1 Hour",
  standardDeliveryTime: "24 Hours",
  deliveryEnabled: true
};

export function SettingsProvider({ children }) {
  const { currentUser } = useAuth();
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_DELIVERY_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Sync Settings from Firestore or LocalStorage
  useEffect(() => {
    if (isConfigValid && db) {
      setLoading(true);
      
      const systemDocRef = doc(db, 'systemSettings', 'config');
      const deliveryDocRef = doc(db, 'deliverySettings', 'config');

      // Realtime listener for System Settings
      const unsubSystem = onSnapshot(systemDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setSystemSettings(docSnap.data());
        } else {
          // If admin is logged in, seed default system settings in Firestore
          if (currentUser?.role === 'admin') {
            setDoc(systemDocRef, {
              ...DEFAULT_SYSTEM_SETTINGS,
              updatedAt: new Date().toISOString()
            }).catch(err => console.error("Failed to seed default system settings:", err));
          }
          setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
        }
      }, (error) => {
        console.error("Error listening to systemSettings:", error);
      });

      // Realtime listener for Delivery Settings
      const unsubDelivery = onSnapshot(deliveryDocRef, (docSnap) => {
        if (docSnap.exists()) {
          // Ensure coordinates are numeric
          const data = docSnap.data();
          setDeliverySettings({
            ...data,
            baseDeliveryFee: Number(data.baseDeliveryFee),
            freeDeliveryThreshold: Number(data.freeDeliveryThreshold),
            hubLatitude: Number(data.hubLatitude),
            hubLongitude: Number(data.hubLongitude),
            priorityRadius: Number(data.priorityRadius),
            maximumServiceRadius: Number(data.maximumServiceRadius)
          });
        } else {
          // If admin is logged in, seed default delivery settings in Firestore
          if (currentUser?.role === 'admin') {
            setDoc(deliveryDocRef, {
              ...DEFAULT_DELIVERY_SETTINGS,
              updatedAt: new Date().toISOString()
            }).catch(err => console.error("Failed to seed default delivery settings:", err));
          }
          setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to deliverySettings:", error);
        setLoading(false);
      });

      return () => {
        unsubSystem();
        unsubDelivery();
      };
    } else {
      // Mock LocalStorage check
      const savedSys = localStorage.getItem('mediquick_system_settings');
      const savedDel = localStorage.getItem('mediquick_delivery_settings');

      if (savedSys) {
        setSystemSettings(JSON.parse(savedSys));
      } else {
        localStorage.setItem('mediquick_system_settings', JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
      }

      if (savedDel) {
        setDeliverySettings(JSON.parse(savedDel));
      } else {
        localStorage.setItem('mediquick_delivery_settings', JSON.stringify(DEFAULT_DELIVERY_SETTINGS));
      }

      setLoading(false);
    }
  }, [currentUser]);

  const saveSystemSettings = async (newSettings) => {
    const payload = {
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    if (isConfigValid && db) {
      await setDoc(doc(db, 'systemSettings', 'config'), payload);
    } else {
      localStorage.setItem('mediquick_system_settings', JSON.stringify(payload));
      setSystemSettings(payload);
    }
  };

  const saveDeliverySettings = async (newSettings) => {
    const payload = {
      ...newSettings,
      baseDeliveryFee: Number(newSettings.baseDeliveryFee),
      freeDeliveryThreshold: Number(newSettings.freeDeliveryThreshold),
      hubLatitude: Number(newSettings.hubLatitude),
      hubLongitude: Number(newSettings.hubLongitude),
      priorityRadius: Number(newSettings.priorityRadius),
      maximumServiceRadius: Number(newSettings.maximumServiceRadius),
      updatedAt: new Date().toISOString()
    };
    if (isConfigValid && db) {
      await setDoc(doc(db, 'deliverySettings', 'config'), payload);
    } else {
      localStorage.setItem('mediquick_delivery_settings', JSON.stringify(payload));
      setDeliverySettings(payload);
    }
  };

  const value = {
    systemSettings,
    deliverySettings,
    saveSystemSettings,
    saveDeliverySettings,
    loading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
