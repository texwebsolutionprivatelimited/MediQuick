import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, isConfigValid } from '../firebase/firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

const DUMMY_NOTIFICATIONS = [
  {
    id: "dummy-1",
    title: "Order Confirmed",
    message: "Your order #MQ1025 has been placed successfully.",
    type: "order_confirmed",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    actionUrl: "/order-tracking"
  },
  {
    id: "dummy-2",
    title: "Prescription Approved",
    message: "Your prescription has been verified successfully.",
    type: "prescription_approved",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    actionUrl: "/order-tracking"
  },
  {
    id: "dummy-3",
    title: "Offers",
    message: "Get 20% OFF on healthcare products.",
    type: "offers",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    actionUrl: "/offers"
  },
  {
    id: "dummy-4",
    title: "WhatsApp Support",
    message: "A pharmacist has replied to your enquiry.",
    type: "whatsapp_support",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    actionUrl: "whatsapp"
  }
];

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is not logged in or Firebase is not configured, load from localStorage or use default dummies
    if (!currentUser || !isConfigValid || !db) {
      const local = localStorage.getItem('mediquick_local_notifications');
      if (local) {
        try {
          setNotifications(JSON.parse(local));
        } catch {
          setNotifications(DUMMY_NOTIFICATIONS);
        }
      } else {
        setNotifications(DUMMY_NOTIFICATIONS);
      }
      return;
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', 'in', [currentUser.uid, 'all'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Convert Firestore Timestamp to JS date / ISO string
        let timeString = new Date().toISOString();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            timeString = data.createdAt.toDate().toISOString();
          } else {
            timeString = new Date(data.createdAt).toISOString();
          }
        }
        list.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'offers',
          isRead: data.isRead || false,
          createdAt: timeString,
          actionUrl: data.actionUrl || ''
        });
      });

      // Sort on client side to avoid needing composite indexes in Firestore
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // If database is connected but no notifications exist, seed them for the user
      if (list.length === 0) {
        setNotifications(DUMMY_NOTIFICATIONS.map(n => ({ ...n, userId: currentUser.uid })));
        DUMMY_NOTIFICATIONS.forEach(async (n) => {
          try {
            await addDoc(collection(db, 'notifications'), {
              userId: currentUser.uid,
              title: n.title,
              message: n.message,
              type: n.type,
              isRead: n.isRead,
              createdAt: serverTimestamp(),
              actionUrl: n.actionUrl
            });
          } catch (err) {
            console.warn("Error seeding notification:", err);
          }
        });
      } else {
        setNotifications(list);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Notifications error:", error);
      // Fallback on error
      const local = localStorage.getItem('mediquick_local_notifications');
      setNotifications(local ? JSON.parse(local) : DUMMY_NOTIFICATIONS);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Save to localStorage when state changes if offline/mock mode
  useEffect(() => {
    if (!currentUser || !isConfigValid || !db) {
      localStorage.setItem('mediquick_local_notifications', JSON.stringify(notifications));
    }
  }, [notifications, currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    if (currentUser && isConfigValid && db) {
      try {
        const batch = [];
        notifications.forEach((n) => {
          if (!n.isRead) {
            const docRef = doc(db, 'notifications', n.id);
            batch.push(updateDoc(docRef, { isRead: true }));
          }
        });
        await Promise.all(batch);
      } catch (err) {
        console.error("Error marking all notifications as read:", err);
      }
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const markAsRead = async (id) => {
    if (currentUser && isConfigValid && db && id && !id.startsWith('dummy-')) {
      try {
        const docRef = doc(db, 'notifications', id);
        await updateDoc(docRef, { isRead: true });
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const addNotification = async (notif) => {
    const payload = {
      userId: currentUser?.uid || 'anonymous',
      title: notif.title,
      message: notif.message,
      type: notif.type || 'offers',
      isRead: false,
      createdAt: serverTimestamp(),
      actionUrl: notif.actionUrl || ''
    };

    if (currentUser && isConfigValid && db) {
      try {
        await addDoc(collection(db, 'notifications'), payload);
      } catch (err) {
        console.error("Error sending notification to Firestore:", err);
      }
    } else {
      const newNotif = {
        id: `local-${Date.now()}`,
        userId: currentUser?.uid || 'anonymous',
        title: notif.title,
        message: notif.message,
        type: notif.type || 'offers',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: notif.actionUrl || ''
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAllAsRead,
      markAsRead,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
