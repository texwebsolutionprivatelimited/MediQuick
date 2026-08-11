import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { db, isConfigValid } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

const LocationContext = createContext();

export function useLocation() {
  return useContext(LocationContext);
}

// Default Central Pharmacy Location: Indiranagar, Bangalore, India
const DEFAULT_PHARMACY_COORDS = { lat: 12.9719, lng: 77.6412 };

// Distance helper using Haversine formula (direct distance in km)
function calculateHaversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export function LocationProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { deliverySettings } = useSettings();
  const [userCoords, setUserCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState(null); // in km
  const [deliveryType, setDeliveryType] = useState(null); // 'priority' | 'standard' | 'unavailable'
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync address changes globally to the user's Firestore profile document
  useEffect(() => {
    if (address && currentUser?.uid) {
      const saveLocationToFirestore = async () => {
        try {
          if (isConfigValid && db) {
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(userDocRef, { location: address }, { merge: true });
          }
        } catch (err) {
          console.error("Failed to auto-save location to Firestore:", err);
        }
      };
      saveLocationToFirestore();
    }
  }, [address, currentUser]);

  // Load from localStorage or check permissions on initialization (only when logged in)
  useEffect(() => {
    if (authLoading) return;

    if (currentUser) {
      try {
        const savedCoords = localStorage.getItem(`mediquick_user_coords_${currentUser.uid}`);
        const savedAddress = localStorage.getItem(`mediquick_user_address_${currentUser.uid}`);
        if (savedCoords && savedAddress) {
          setUserCoords(JSON.parse(savedCoords));
          setAddress(savedAddress);
        } else {
          // Automatically check if geolocation permission was already granted
          if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
              if (result.state === 'granted') {
                detectLocation();
              }
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Failed to load cached location:", e);
      }
    } else {
      // Clear location state for guest users
      setUserCoords(null);
      setAddress("");
      setDistance(null);
      setDeliveryType(null);
      setDeliveryCharge(0);
    }
  }, [currentUser, authLoading]);

  // Re-calculate delivery whenever userCoords or deliverySettings change
  useEffect(() => {
    if (userCoords && deliverySettings) {
      const hubCoords = {
        lat: Number(deliverySettings.hubLatitude) || DEFAULT_PHARMACY_COORDS.lat,
        lng: Number(deliverySettings.hubLongitude) || DEFAULT_PHARMACY_COORDS.lng
      };

      const dist = calculateHaversineDistance(hubCoords, userCoords);
      setDistance(dist);

      if (!deliverySettings.deliveryEnabled) {
        setDeliveryType('unavailable');
        setDeliveryCharge(0);
      } else if (dist > Number(deliverySettings.maximumServiceRadius)) {
        setDeliveryType('unavailable');
        setDeliveryCharge(0);
      } else if (dist <= Number(deliverySettings.priorityRadius)) {
        setDeliveryType('priority');
      } else {
        setDeliveryType('standard');
      }

      // Save coordinates to localStorage (only when logged in)
      if (currentUser) {
        localStorage.setItem(`mediquick_user_coords_${currentUser.uid}`, JSON.stringify(userCoords));
      }
    } else {
      setDistance(null);
      setDeliveryType(null);
      setDeliveryCharge(0);
    }
  }, [userCoords, deliverySettings, currentUser]);

  const calculateDeliveryFee = (subtotal) => {
    if (subtotal <= 0) return 0;
    if (subtotal < 500) return 20;
    if (subtotal < 1600) return 50;
    return 0; // Free delivery for ₹1600 and above
  };

  // Save address changes to localStorage (only when logged in)
  useEffect(() => {
    if (address && currentUser) {
      localStorage.setItem(`mediquick_user_address_${currentUser.uid}`, address);
    }
  }, [address, currentUser]);

  // GPS geolocation detection
  const detectLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = { lat, lng };
        setUserCoords(coords);
        
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            if (status === "OK" && results[0]) {
              setAddress(results[0].formatted_address);
            } else {
              setAddress(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
            setLoading(false);
          });
        } else {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              {
                headers: {
                  'Accept-Language': 'en'
                }
              }
            );
            if (!response.ok) {
              throw new Error("Nominatim API request failed");
            }
            const data = await response.json();
            
            let resolvedAddress = "";
            if (data.address) {
              const road = data.address.road || data.address.suburb || "";
              const city = data.address.city || data.address.town || data.address.village || "";
              const state = data.address.state || "";
              const country = data.address.country || "";
              
              const parts = [];
              if (road) parts.push(road);
              if (city) parts.push(city);
              if (state) parts.push(state);
              if (country) parts.push(country);
              resolvedAddress = parts.join(", ");
            }

            if (!resolvedAddress) {
              resolvedAddress = data.display_name || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            setAddress(resolvedAddress);
          } catch (err) {
            console.error("OSM geocoding failed, falling back to mock:", err);
            const dist = calculateHaversineDistance(PHARMACY_COORDS, coords);
            if (dist <= 5) {
              setAddress("Gachibowli Flyover, Gachibowli, Hyderabad, 500032");
            } else {
              setAddress("Secunderabad Junction, Hyderabad, 500003");
            }
          } finally {
            setLoading(false);
          }
        }
      },
      (err) => {
        console.warn("Geolocation permission denied or error:", err);
        setError("Location permission denied. Please enter your address manually.");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
    );
  };

  const manualSetLocation = (addressText, customCoords = null) => {
    setAddress(addressText);
    if (customCoords) {
      setUserCoords(customCoords);
    } else {
      const isPriority = addressText.toLowerCase().includes("gachibowli") || addressText.length < 35;
      if (isPriority) {
        setUserCoords({ lat: 17.4230, lng: 78.3460 }); // ~0.2 km from Gachibowli
      } else {
        setUserCoords({ lat: 17.4399, lng: 78.4983 }); // ~15.2 km (Secunderabad)
      }
    }
  };

  const value = {
    userCoords,
    address,
    distance,
    deliveryType,
    deliveryCharge,
    calculateDeliveryFee,
    loading,
    error,
    detectLocation,
    manualSetLocation,
    pharmacyCoords: {
      lat: Number(deliverySettings?.hubLatitude) || DEFAULT_PHARMACY_COORDS.lat,
      lng: Number(deliverySettings?.hubLongitude) || DEFAULT_PHARMACY_COORDS.lng
    }
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
