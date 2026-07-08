import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function useLocation() {
  return useContext(LocationContext);
}

// Default Central Pharmacy Location: Indiranagar, Bangalore, India
const PHARMACY_COORDS = { lat: 12.9719, lng: 77.6412 };

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
  const [userCoords, setUserCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState(null); // in km
  const [deliveryType, setDeliveryType] = useState(null); // 'priority' | 'standard'
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load from localStorage on initialization
  useEffect(() => {
    try {
      const savedCoords = localStorage.getItem('mediquick_user_coords');
      const savedAddress = localStorage.getItem('mediquick_user_address');
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
          }).catch(err => console.log("Permissions query not supported", err));
        }
      }
    } catch (e) {
      console.error("Failed to load cached location:", e);
    }
  }, []);

  // Re-calculate delivery whenever userCoords change
  useEffect(() => {
    if (userCoords) {
      const dist = calculateHaversineDistance(PHARMACY_COORDS, userCoords);
      setDistance(dist);
      
      if (dist <= 5.0) {
        setDeliveryType('priority');
        setDeliveryCharge(0); // Priority delivery under 5km is FREE for premium feel
      } else {
        setDeliveryType('standard');
        const calculatedCharge = 30 + Math.round((dist - 5) * 10);
        setDeliveryCharge(calculatedCharge);
      }
      
      // Save coordinates to localStorage
      localStorage.setItem('mediquick_user_coords', JSON.stringify(userCoords));
    } else {
      setDistance(null);
      setDeliveryType(null);
      setDeliveryCharge(0);
    }
  }, [userCoords]);

  // Save address changes to localStorage
  useEffect(() => {
    if (address) {
      localStorage.setItem('mediquick_user_address', address);
    }
  }, [address]);

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
      (position) => {
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
          // Beautiful Mock Address based on proximity (Hyderabad, Gachibowli is default local)
          setTimeout(() => {
            const dist = calculateHaversineDistance(PHARMACY_COORDS, coords);
            if (dist <= 5) {
              setAddress("Gachibowli Flyover, Gachibowli, Hyderabad, 500032");
            } else {
              setAddress("Secunderabad Junction, Hyderabad, 500003");
            }
            setLoading(false);
          }, 800);
        }
      },
      (err) => {
        console.warn("Geolocation permission denied or error:", err);
        setError("Location permission denied. Please enter your address manually.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
    loading,
    error,
    detectLocation,
    manualSetLocation,
    pharmacyCoords: PHARMACY_COORDS
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
