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
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        localStorage.setItem('user_coords', JSON.stringify({ lat: latitude, lng: longitude }));

        // Resolve location instantly using high-precision Geofence Engine (No external OSM rate-limit)
        const geofenceLoc = resolveGeofenceLocation(latitude, longitude);
        setGeofence(geofenceLoc);
        setIsWithinServiceArea(geofenceLoc.isWithinServiceArea);
        setAddress(geofenceLoc.address);
        setCity(geofenceLoc.city);

        localStorage.setItem('user_address', geofenceLoc.address);
        localStorage.setItem('user_city', geofenceLoc.city);
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
    <LocationContext.Provider value={{ address, city, coords, geofence, isWithinServiceArea, fetchLocation, isLocating, setAddress, setCity }}>
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
