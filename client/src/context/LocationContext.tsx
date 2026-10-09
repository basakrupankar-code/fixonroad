import React, { createContext, useContext, useState, useEffect } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface LocationContextType {
  address: string;
  city: string;
  coords: Coords | null;
  isLocating: boolean;
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
  const [isLocating, setIsLocating] = useState(false);

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        localStorage.setItem('user_coords', JSON.stringify({ lat: latitude, lng: longitude }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
            {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9',
              },
            }
          );
          const data = await res.json();
          const addr = data.address || {};
          
          // Pick the most granular English locality name
          const rawTown =
            addr.suburb ||
            addr.village ||
            addr.town ||
            addr.city_district ||
            addr.city ||
            addr.county ||
            'Kalyani';
          
          const state = addr.state || 'West Bengal';
          const cleanCity = `${rawTown}, ${state}`;
          const fullAddress = data.display_name || cleanCity;

          setAddress(fullAddress);
          setCity(cleanCity);
          localStorage.setItem('user_address', fullAddress);
          localStorage.setItem('user_city', cleanCity);
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied/failed:", err);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true, // Forces hardware GPS over IP lookup
        timeout: 15000,
        maximumAge: 0, // Prevents using cached ISP location
      }
    );
  };

  useEffect(() => {
    // If no address is cached, detect on mount
    if (!localStorage.getItem('user_address')) {
      fetchLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ address, city, coords, fetchLocation, isLocating, setAddress, setCity }}>
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
