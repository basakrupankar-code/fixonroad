import { useState, useEffect, useCallback, useRef } from 'react';
import { safeFetch } from '../lib/api';
import { isValidCoordinate } from '../utils/distance';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressInfo {
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  ip?: string;
}

export type LocationSource = 'gps' | 'ip' | 'cache' | 'default' | 'manual';

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED' | 'IP_FALLBACK_FAILED';
  message: string;
  details?: string;
}

export interface UseCurrentLocationOptions {
  /** If true, immediately attempts to resolve location on mount (default: true) */
  autoFetch?: boolean;
  /** Maximum time in ms before Geolocation times out (default: 10000) */
  timeout?: number;
  /** Maximum age in ms of a cached position (default: 60000) */
  maximumAge?: number;
  /** Request GPS high accuracy when supported (default: true) */
  enableHighAccuracy?: boolean;
  /** Default fallback coordinates when GPS and IP fail (default: Kalyani/Kolkata hub: 22.9772, 88.4312) */
  fallbackCoords?: Coordinates;
  /** Whether to sync resolved coordinates to backend profile (/api/v1/me) (default: false) */
  syncWithBackend?: boolean;
}

const DEFAULT_FALLBACK: Coordinates = {
  lat: 22.9772,
  lng: 88.4312
};

const CACHE_STORAGE_KEY = 'fixonroad_last_known_location';

/**
 * Robust React Hook for high-reliability Geolocation.
 * Handles GPS timeouts, user permission rejections, and hardware positioning failures
 * by automatically cascading from Browser GPS -> IP Geolocation -> Cached Location -> Service Hub Default.
 */
export function useCurrentLocation(options: UseCurrentLocationOptions = {}) {
  const {
    autoFetch = true,
    timeout = 10000,
    maximumAge = 60000,
    enableHighAccuracy = true,
    fallbackCoords = DEFAULT_FALLBACK,
    syncWithBackend = false
  } = options;

  // Initialize state with cached location if available
  const [coords, setCoords] = useState<Coordinates | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isValidCoordinate(parsed?.lat, parsed?.lng)) {
          return { lat: parsed.lat, lng: parsed.lng };
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [source, setSource] = useState<LocationSource | null>(() => (coords ? 'cache' : null));
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [error, setError] = useState<LocationError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync coordinates to backend profile if requested
  const syncToProfile = useCallback(async (newCoords: Coordinates) => {
    if (!syncWithBackend || !isValidCoordinate(newCoords.lat, newCoords.lng)) return;
    try {
      await safeFetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLocation: newCoords })
      });
    } catch (err) {
      console.warn('Location sync to profile failed:', err);
    }
  }, [syncWithBackend]);

  // Save to localStorage
  const saveToCache = (newCoords: Coordinates) => {
    try {
      localStorage.setItem(
        CACHE_STORAGE_KEY,
        JSON.stringify({ ...newCoords, timestamp: Date.now() })
      );
    } catch {
      // Ignore
    }
  };

  /**
   * Fast IP-based Geolocation fallback using public HTTPS IP intelligence
   */
  const fetchIpLocation = useCallback(async (): Promise<{ coords: Coordinates; info: AddressInfo } | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Service 1: ipwho.is (fast, HTTPS, CORS-friendly, free)
      const res = await fetch('https://ipwho.is/', {
        signal,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && isValidCoordinate(data.latitude, data.longitude)) {
          return {
            coords: { lat: data.latitude, lng: data.longitude },
            info: {
              city: data.city,
              region: data.region,
              country: data.country,
              postal: data.postal,
              ip: data.ip
            }
          };
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return null;
      console.warn('ipwho.is failed, trying fallback IP provider:', e);
    }

    try {
      // Service 2: ipapi.co fallback
      const res = await fetch('https://ipapi.co/json/', {
        signal,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (isValidCoordinate(data.latitude, data.longitude)) {
          return {
            coords: { lat: data.latitude, lng: data.longitude },
            info: {
              city: data.city,
              region: data.region,
              country: data.country_name,
              postal: data.postal,
              ip: data.ip
            }
          };
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return null;
      console.warn('IP-based geolocation fallback failed:', e);
    }

    return null;
  }, []);

  /**
   * Primary location acquisition function
   */
  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 1. Check Browser Geolocation API support
    if (!('geolocation' in navigator)) {
      const unsupportedErr: LocationError = {
        code: 'UNSUPPORTED',
        message: 'Browser does not support HTML5 Geolocation. Utilizing network location.'
      };
      setError(unsupportedErr);

      // Attempt IP fallback
      const ipResult = await fetchIpLocation();
      if (ipResult) {
        setCoords(ipResult.coords);
        setSource('ip');
        setAddressInfo(ipResult.info);
        saveToCache(ipResult.coords);
        syncToProfile(ipResult.coords);
      } else {
        setCoords(fallbackCoords);
        setSource('default');
      }
      setIsLoading(false);
      return;
    }

    // 2. Wrap navigator.geolocation in a Promise with strict timeout
    const getPositionPromise = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy,
          timeout,
          maximumAge
        });
      });

    try {
      const position = await getPositionPromise();
      const newCoords: Coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (isValidCoordinate(newCoords.lat, newCoords.lng)) {
        setCoords(newCoords);
        setSource('gps');
        setAccuracy(position.coords.accuracy);
        setError(null);
        saveToCache(newCoords);
        syncToProfile(newCoords);
        setIsLoading(false);
        return;
      }
      throw new Error('Coordinates received from GPS were invalid or zeroed.');
    } catch (geoErr: any) {
      // 3. Handle distinct error codes
      let mappedError: LocationError;
      switch (geoErr.code) {
        case 1: // PERMISSION_DENIED
          mappedError = {
            code: 'PERMISSION_DENIED',
            message: 'Location access was denied. Network region will be used instead.',
            details: geoErr.message
          };
          break;
        case 2: // POSITION_UNAVAILABLE
          mappedError = {
            code: 'POSITION_UNAVAILABLE',
            message: 'GPS satellite/network position unavailable. Using IP location.',
            details: geoErr.message
          };
          break;
        case 3: // TIMEOUT
          mappedError = {
            code: 'TIMEOUT',
            message: `Location acquisition timed out after ${timeout / 1000}s. Using fallback.`,
            details: geoErr.message
          };
          break;
        default:
          mappedError = {
            code: 'POSITION_UNAVAILABLE',
            message: geoErr.message || 'Unable to determine GPS location.',
            details: geoErr.message
          };
      }
      setError(mappedError);

      // 4. Cascade to IP Geolocation
      const ipResult = await fetchIpLocation();
      if (ipResult) {
        setCoords(ipResult.coords);
        setSource('ip');
        setAddressInfo(ipResult.info);
        saveToCache(ipResult.coords);
        syncToProfile(ipResult.coords);
      } else {
        // 5. Final fallback to service hub coordinates
        setCoords(fallbackCoords);
        setSource('default');
        saveToCache(fallbackCoords);
      }
      setIsLoading(false);
    }
  }, [
    enableHighAccuracy,
    timeout,
    maximumAge,
    fallbackCoords,
    fetchIpLocation,
    syncToProfile
  ]);

  /**
   * Allows setting coordinates manually (e.g. from map pin drag or city picker)
   */
  const setManualCoordinates = useCallback((newCoords: Coordinates) => {
    if (isValidCoordinate(newCoords.lat, newCoords.lng)) {
      setCoords(newCoords);
      setSource('manual');
      setError(null);
      saveToCache(newCoords);
      syncToProfile(newCoords);
    }
  }, [syncToProfile]);

  useEffect(() => {
    if (autoFetch) {
      requestLocation();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, requestLocation]);

  return {
    coords,
    source,
    accuracy,
    addressInfo,
    isLoading,
    error,
    refreshLocation: requestLocation,
    setManualCoordinates
  };
}
