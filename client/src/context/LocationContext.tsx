import React, { createContext, useContext, useState, useEffect } from 'react';
import { resolveGeofenceLocation, type GeofencedLocation } from '../lib/geofencing';

interface Coords {
  lat: number;
  lng: number;
}

interface LocationContextType {
  address: string;
  city: string;
  coords: Coords | null;
  isLocating: boolean;
  geofence: GeofencedLocation | null;
  isWithinServiceArea: boolean;
  fetchLocation: () => void;
  setAddress: (address: string) => void;
  setCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string>(() => localStorage.getItem('user_address') || 'Detecting location...');
  const [city, setCity] = useState<string>(() => localStorage.getItem('user_city') || 'Detecting...');
  const [coords, setCoords] = useState<Coords | null>(() => {
    const saved = localStorage.getItem('user_coords');
    return saved ? JSON.parse(saved) : null;
  });
  const [geofence, setGeofence] = useState<GeofencedLocation | null>(() => {
    const saved = localStorage.getItem('user_geofence');
    return saved ? JSON.parse(saved) : null;
  });
  const [isWithinServiceArea, setIsWithinServiceArea] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<{ address: string; city: string } | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'FixOnRoad-Dispatch/1.0'
          }
        }
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const road = addr.road || addr.suburb || addr.neighbourhood || '';
          const town = addr.city || addr.town || addr.village || addr.municipality || 'Kalyani';
          const district = addr.state_district || addr.county || 'Nadia';
          const state = addr.state || 'West Bengal';
          const postcode = addr.postcode ? ` ${addr.postcode}` : '';
          const formatted = road 
            ? `${road}, ${town}, ${district}, ${state}${postcode}`
            : data.display_name;
          return { address: formatted, city: `${town}, ${district}` };
        }
      }
    } catch (_err) {
      // Fallback silently to intelligent geofence resolution
    }
    return null;
  };

  const setSynchronizedAddress = (newAddr: string) => {
    setAddress(newAddr);
    localStorage.setItem('user_address', newAddr);

    // If user selected Samudragar, lock coordinates to genuine Samudragar coordinates (~23.3610, 88.3180)
    const lower = newAddr.toLowerCase();
    if (lower.includes('samudragar') || lower.includes('kalna')) {
      const samCoords = { lat: 23.3610, lng: 88.3180 };
      setCoords(samCoords);
      localStorage.setItem('user_coords', JSON.stringify(samCoords));
      setCity('Samudragar, Purba Bardhaman');
      localStorage.setItem('user_city', 'Samudragar, Purba Bardhaman');
      return;
    }

    if (lower.includes('kalyani')) {
      const kalCoords = { lat: 22.9772, lng: 88.4312 };
      setCoords(kalCoords);
      localStorage.setItem('user_coords', JSON.stringify(kalCoords));
      setCity('Kalyani, Nadia');
      localStorage.setItem('user_city', 'Kalyani, Nadia');
      return;
    }
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      // Default to primary hub if geolocation not available
      const fallback = resolveGeofenceLocation(22.9772, 88.4312);
      setCoords({ lat: 22.9772, lng: 88.4312 });
      setGeofence(fallback);
      setIsWithinServiceArea(true);
      setAddress(fallback.address);
      setCity(fallback.city);
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        localStorage.setItem('user_coords', JSON.stringify({ lat: latitude, lng: longitude }));

        // 1. Resolve location immediately using high-precision Geofence Engine (Zero-latency offline protection)
        const geofenceLoc = resolveGeofenceLocation(latitude, longitude);
        setGeofence(geofenceLoc);
        setIsWithinServiceArea(geofenceLoc.isWithinServiceArea);

        // 2. Dynamically reverse-geocode to reflect actual street locality (e.g. inside Kalyani)
        const liveGeo = await reverseGeocode(latitude, longitude);
        const resolvedAddress = liveGeo ? liveGeo.address : geofenceLoc.address;
        const resolvedCity = liveGeo ? liveGeo.city : geofenceLoc.city;

        setAddress(resolvedAddress);
        setCity(resolvedCity);

        localStorage.setItem('user_address', resolvedAddress);
        localStorage.setItem('user_city', resolvedCity);
        localStorage.setItem('user_geofence', JSON.stringify(geofenceLoc));
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation denied/unavailable, defaulting to primary service hub:", err);
        const fallback = resolveGeofenceLocation(22.9772, 88.4312);
        setCoords({ lat: 22.9772, lng: 88.4312 });
        setGeofence(fallback);
        setIsWithinServiceArea(true);
        if (!localStorage.getItem('user_address') || localStorage.getItem('user_address') === 'Detecting location...') {
          setAddress(fallback.address);
          setCity(fallback.city);
          localStorage.setItem('user_address', fallback.address);
          localStorage.setItem('user_city', fallback.city);
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    // If no address is cached or it's placeholder, detect on mount
    const cached = localStorage.getItem('user_address');
    if (!cached || cached === 'Detecting location...') {
      fetchLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ address, city, coords, geofence, isWithinServiceArea, fetchLocation, isLocating, setAddress: setSynchronizedAddress, setCity }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
