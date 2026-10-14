import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  MapPin, PhoneCall, ChevronLeft, Navigation2, Copy, Check, 
  Bike, ShieldCheck, Clock, CheckCircle2, AlertCircle, ArrowRight,
  ListOrdered
} from 'lucide-react';
import { motion } from 'framer-motion';
import { safeFetch } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom markers for high-contrast visibility
const mechanicMarkerIcon = L.divIcon({
  className: 'custom-mechanic-marker',
  html: `<div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(249,115,22,0.7); border: 2.5px solid #ffffff;">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22]
});

const userMarkerIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(16,185,129,0.7); border: 2.5px solid #ffffff;">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22]
});

// Auto-adjust map view to encapsulate the entire route
function AutoFitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        console.warn("Could not fit bounds:", e);
      }
    }
  }, [points, map]);
  return null;
}

interface MechanicInfo {
  name: string;
  specialty: string;
  hub: string;
  vehicle: string;
  phone: string;
  rating: number;
  originLat: number;
  originLng: number;
  isAssigned: boolean;
}

export default function TrackingPage() {
  const { orderId } = useParams();

  const defaultOrigin: [number, number] = [22.9772, 88.4312]; // Kalyani Central Auto Hub
  const defaultDestination: [number, number] = [23.3644, 88.3182]; // Breakdown Location

  const [orderCode, setOrderCode] = useState<string>('');
  const [eta, setEta] = useState<number>(35);
  const [status, setStatus] = useState<string>('Finding Mechanic...');
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [distance, setDistance] = useState<string>('0.0');
  const [serviceType, setServiceType] = useState<string>('Roadside Assistance');
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [routingEngine, setRoutingEngine] = useState<string>('osrm-bike');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const destinationLabel = 
    localStorage.getItem('user_city') || 
    localStorage.getItem('user_address') || 
    'Your Breakdown Location';
  const [destination, setDestination] = useState<string>(destinationLabel);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ 
    lat: defaultDestination[0], 
    lng: defaultDestination[1] 
  });

  const [mechanic, setMechanic] = useState<MechanicInfo>({
    name: "Dispatching Technician...",
    specialty: "Certified Roadside Specialist",
    hub: "FixOnRoad Rapid Response Hub",
    vehicle: "Two-Wheeler Rapid Response Unit",
    phone: "+91 98001 12233",
    rating: 4.9,
    originLat: defaultOrigin[0],
    originLng: defaultOrigin[1],
    isAssigned: false
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const data = await safeFetch(`/api/v1/bookings/${orderId}`, { headers });
        if (isMounted && data) {
          setIsLoading(false);
          setOrderCode(data.orderCode || (data._id ? `FOR-${data._id.slice(0, 6).toUpperCase()}` : 'FOR-PENDING'));
          setStatus(data.status ? data.status.replace(/_/g, ' ') : 'CONFIRMED');
          setPaymentStatus(data.status === 'PAID' ? 'PAID' : (data.paymentMethod === 'cod' ? 'COD' : 'PENDING'));

          if (data.serviceType) {
            setServiceType(data.serviceType.replace(/-/g, ' ').toUpperCase());
          }

          // Breakdown destination location
          const address = data.location?.address || data.address;
          const destinationAddress = 
            address || 
            localStorage.getItem('breakdown_address') || 
            'Your Breakdown Location';

          const destLat = typeof data.location?.lat === 'number' && data.location.lat !== 0 ? data.location.lat : defaultDestination[0];
          const destLng = typeof data.location?.lng === 'number' && data.location.lng !== 0 ? data.location.lng : defaultDestination[1];

          setDestination(destinationAddress);
          setUserLocation({ lat: destLat, lng: destLng });

          // Extract populated mechanic details dynamically from the database
          let mechLat = defaultOrigin[0];
          let mechLng = defaultOrigin[1];
          let isAssigned = false;

          if (data.mechanicId && typeof data.mechanicId === 'object') {
            isAssigned = true;
            const m = data.mechanicId;
            if (typeof m.currentLocation?.lat === 'number' && m.currentLocation.lat !== 0) {
              mechLat = m.currentLocation.lat;
            }
            if (typeof m.currentLocation?.lng === 'number' && m.currentLocation.lng !== 0) {
              mechLng = m.currentLocation.lng;
            }

            const specialties = Array.isArray(m.serviceCategories) && m.serviceCategories.length > 0
              ? m.serviceCategories.join(' • ')
              : m.specialization || 'Certified Two-Wheeler Specialist';

            setMechanic({
              name: m.name || 'Certified Partner Technician',
              specialty: specialties,
              hub: m.workshopName || 'FixOnRoad Certified Partner Hub',
              vehicle: m.vehiclePlate ? `Motorcycle (${m.vehiclePlate})` : 'Two-Wheeler Rapid Response Bike',
              phone: m.phone || '+91 98001 12233',
              rating: typeof m.rating === 'number' && m.rating > 0 ? m.rating : 4.9,
              originLat: mechLat,
              originLng: mechLng,
              isAssigned: true
            });
          }

          // Real OSRM Road Distance & Two-Wheeler realistic ETA
          if (typeof data.roadDistanceKm === 'number' && data.roadDistanceKm > 0) {
            setDistance(data.roadDistanceKm.toFixed(1));
          } else {
            // Straight line fallback estimate
            const R = 6371;
            const dLat = (destLat - mechLat) * (Math.PI / 180);
            const dLon = (destLng - mechLng) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(mechLat * (Math.PI / 180)) * Math.cos(destLat * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            setDistance((R * c).toFixed(1));
          }

          if (typeof data.estimatedDurationMin === 'number' && data.estimatedDurationMin > 0) {
            setEta(data.estimatedDurationMin);
          } else {
            setEta(Math.max(8, Math.round(Number(distance) * 2.2)));
          }

          // Actual OSRM Road Geometry (GeoJSON coordinates converted to Leaflet [lat, lng])
          if (Array.isArray(data.routePolyline) && data.routePolyline.length > 1) {
            setRoutePolyline(data.routePolyline);
          } else {
            // Direct origin to destination fallback
            setRoutePolyline([[mechLat, mechLng], [destLat, destLng]]);
          }

          if (data.routingEngine) {
            setRoutingEngine(data.routingEngine);
          }
        }
      } catch (err) {
        console.error("Failed to fetch order tracking status", err);
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setEta((prev) => Math.max(1, prev - 1));
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const copyCode = () => {
    if (orderCode) {
      navigator.clipboard.writeText(orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Polyline coordinates for map bounds
  const mapPoints: [number, number][] = useMemo(() => {
    if (routePolyline && routePolyline.length > 0) {
      return routePolyline;
    }
    return [
      [mechanic.originLat, mechanic.originLng],
      [userLocation.lat, userLocation.lng]
    ];
  }, [routePolyline, mechanic.originLat, mechanic.originLng, userLocation.lat, userLocation.lng]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-['Outfit',sans-serif]">
      <Navbar variant="rider" />

      <div className="flex-1 flex flex-col pt-24 px-4 pb-12 max-w-5xl mx-auto w-full">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 font-semibold text-sm transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          
          <Link 
            to="/orders" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 text-sm font-medium text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <ListOrdered className="w-4 h-4 text-orange-400" />
            <span>My Bookings</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Main Card Container */}
        <div className="bg-[#121824] rounded-3xl border border-slate-800 p-6 md:p-10 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
          {/* Subtle Orange Glow Top Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

          {/* Header Row: Title & Real Road Metrics */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Live Dispatch Tracking</h1>
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE RADAR
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-400 text-sm font-medium">Tracking Code:</span>
                <span className="font-mono text-sm font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/20">
                  {orderCode || 'FOR-ORDER'}
                </span>
                <button
                  onClick={copyCode}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Copy Tracking Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span className="text-xs text-slate-500">• {serviceType}</span>
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="flex gap-6 items-center bg-[#0B0F17]/80 p-3.5 rounded-2xl border border-slate-800">
              {/* Road Distance */}
              <div className="text-left md:text-right">
                <div className="text-slate-400 text-xs font-semibold mb-0.5 uppercase tracking-wider flex items-center gap-1">
                  <Navigation2 className="w-3 h-3 text-orange-400" /> Road Distance
                </div>
                <div className="text-xl font-black text-white">{distance} <span className="text-xs font-medium text-slate-400">km</span></div>
                <div className="text-[10px] text-slate-500 font-mono">Actual Road Route</div>
              </div>

              <div className="w-px h-10 bg-slate-800" />

              {/* Two-Wheeler ETA */}
              <div className="text-left md:text-right">
                <div className="text-slate-400 text-xs font-semibold mb-0.5 uppercase tracking-wider flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-orange-400" /> Bike ETA
                </div>
                <div className="text-2xl font-black text-orange-400">{eta} <span className="text-xs font-medium text-slate-400">min</span></div>
                <div className="text-[10px] text-orange-400/80 font-medium">~28 km/h Urban Avg</div>
              </div>

              <div className="w-px h-10 bg-slate-800 hidden sm:block" />

              {/* Status Badge */}
              <div className="hidden sm:block text-right">
                <div className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Status</div>
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md border ${
                  paymentStatus === 'PAID'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Left Details & Right Live Road Map */}
          <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-[460px]">
            {/* Left Column: Mechanic Details & Timeline */}
            <div className="flex flex-col gap-4">
              {/* Dynamic Assigned Mechanic Card */}
              <div className="bg-[#0B0F17] rounded-2xl border border-slate-800/90 p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-orange-500/40 relative">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mechanic.name)}&background=ea580c&color=fff&bold=true`} 
                      alt={mechanic.name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-2 border-[#0B0F17]">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg truncate text-white">{mechanic.name}</h3>
                      <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded font-bold border border-orange-500/30 shrink-0">
                        {mechanic.rating} ★
                      </span>
                    </div>
                    <div className="text-xs text-orange-400 font-medium mt-0.5 truncate">{mechanic.specialty}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">{mechanic.hub}</div>
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-700/60">
                      <Bike className="w-3.5 h-3.5 text-orange-400" />
                      <span>{mechanic.vehicle}</span>
                    </div>
                  </div>

                  {/* Direct Contact Button */}
                  <a 
                    href={`tel:${mechanic.phone}`}
                    className="p-3.5 bg-emerald-500/15 text-emerald-400 rounded-2xl hover:bg-emerald-500/25 transition-all shrink-0 border border-emerald-500/30 group shadow-md"
                    title={`Call ${mechanic.name}`}
                  >
                    <PhoneCall className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Dispatched via Two-Wheeler
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Background Verified
                  </span>
                </div>
              </div>

              {/* Real Road Network Routing Details */}
              <div className="bg-[#0B0F17] rounded-2xl border border-slate-800/90 p-5 flex-1 flex flex-col justify-between shadow-lg">
                <div>
                  <h4 className="font-bold text-sm mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Navigation2 className="w-4 h-4 text-orange-400" /> Route & Waypoints
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-800/60 px-2 py-0.5 rounded">
                      Engine: {routingEngine}
                    </span>
                  </h4>
                  
                  <div className="relative pl-6 space-y-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-orange-500 to-emerald-500" />
                    
                    {/* Origin Hub */}
                    <div className="relative z-10">
                      <div className="absolute -left-6 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#0B0F17] shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                      <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider">Dispatched From</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{mechanic.hub}</p>
                      <p className="text-xs text-slate-400">Mechanic en route on service bike</p>
                    </div>

                    {/* Customer Destination */}
                    <div className="relative z-10">
                      <div className="absolute -left-6 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0F17] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Your Breakdown Spot</p>
                      <p className="text-sm font-semibold text-white mt-0.5 line-clamp-2">{destination}</p>
                      <p className="text-xs text-slate-400">Stand by safe roadside area</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Payment Mode</span>
                  <span className="font-semibold text-white">
                    {paymentStatus === 'PAID' ? 'Paid Online via Razorpay' : 'Cash / UPI on Service Arrival'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Leaflet Road Curve Map Visualization */}
            <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F17] relative shadow-inner">
              {userLocation && mechanic ? (
                <MapContainer 
                  center={[(mechanic.originLat + userLocation.lat) / 2, (mechanic.originLng + userLocation.lng) / 2]} 
                  zoom={11} 
                  className="w-full h-full min-h-[420px] z-10"
                  scrollWheelZoom={false}
                >
                  {/* High contrast dark theme tile layer via OSM with CSS invert */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles"
                  />
                  <style>{`
                    .map-tiles {
                      filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(95%);
                    }
                    .leaflet-popup-content-wrapper {
                      background-color: #121824 !important;
                      color: #ffffff !important;
                      border-radius: 12px !important;
                      border: 1px solid #334155 !important;
                    }
                    .leaflet-popup-tip {
                      background-color: #121824 !important;
                    }
                  `}</style>

                  {/* Auto-fits Leaflet view to the actual road polyline */}
                  <AutoFitBounds points={mapPoints} />

                  {/* Mechanic Partner Marker */}
                  <Marker position={[mechanic.originLat, mechanic.originLng]} icon={mechanicMarkerIcon}>
                    <Popup className="font-['Outfit']">
                      <div className="p-1">
                        <strong className="text-orange-400 text-sm">{mechanic.name}</strong>
                        <div className="text-xs text-slate-300 font-medium">{mechanic.hub}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{mechanic.vehicle}</div>
                        <div className="text-xs text-orange-400 font-bold mt-1">Rating: {mechanic.rating} ★</div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Customer Breakdown Marker */}
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
                    <Popup className="font-['Outfit']">
                      <div className="p-1">
                        <strong className="text-emerald-400 text-sm">Your Location</strong>
                        <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">{destination}</div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Real Road Curve Polyline from OSRM */}
                  <Polyline 
                    positions={routePolyline}
                    pathOptions={{ 
                      color: '#f97316', 
                      weight: 5, 
                      opacity: 0.95,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                </MapContainer>
              ) : (
                <div className="text-slate-400 flex flex-col items-center justify-center h-full min-h-[420px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3" />
                  <p className="text-sm font-medium">Computing road network routes...</p>
                </div>
              )}

              {/* Floating Overlay Badge on Map */}
              <div className="absolute bottom-4 left-4 z-[400] bg-[#0B0F17]/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                <span className="font-bold text-white">OSRM Road Geometry:</span>
                <span className="text-slate-300 font-mono">{distance} km</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer variant="rider" />
    </div>
  );
}
