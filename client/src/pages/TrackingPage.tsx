import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, PhoneCall, ChevronLeft, Navigation2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { safeFetch } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

interface MechanicInfo {
  name: string;
  specialty: string;
  hub: string;
  vehicle: string;
  phone: string;
  rating: number;
  originLat: number;
  originLng: number;
}

export default function TrackingPage() {
  const { orderId } = useParams();
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const defaultOrigin = [22.9772, 88.4312]; // Kalyani Central Park Auto Hub fallback
  const defaultDestination = [23.3644, 88.3182]; // Breakdown location fallback
  const initialDistance = calculateDistance(defaultOrigin[0], defaultOrigin[1], defaultDestination[0], defaultDestination[1]);

  const [eta, setEta] = useState<number>(Math.max(5, Math.round(Number(initialDistance) * 2.5)));
  const [status, setStatus] = useState('Finding Mechanic...');
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [distance, setDistance] = useState<string>(initialDistance);
  const destinationLabel = 
    localStorage.getItem('user_city') || 
    localStorage.getItem('user_address') || 
    'Your Breakdown Location';
  const [destination, setDestination] = useState<string>(destinationLabel);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({ lat: defaultDestination[0], lng: defaultDestination[1] });

  const [mechanic, setMechanic] = useState<MechanicInfo>({
    name: "Dispatching Technician...",
    specialty: "Certified Roadside Specialist",
    hub: "FixOnRoad Rapid Response Hub",
    vehicle: "Emergency Service Vehicle",
    phone: "+91 98001 12233",
    rating: 4.9,
    originLat: defaultOrigin[0],
    originLng: defaultOrigin[1]
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
          setStatus(data.status ? data.status.replace(/_/g, ' ') : 'MECHANIC ASSIGNED');
          setPaymentStatus(data.status === 'PAID' ? 'PAID' : (data.paymentMethod === 'cod' ? 'COD' : 'PENDING'));

          // Extract breakdown destination coordinates
          const address = data.location?.address || data.address;
          const destinationAddress = 
            address || 
            localStorage.getItem('breakdown_address') || 
            'Your Breakdown Location';

          const destLat = typeof data.location?.lat === 'number' && data.location.lat !== 0 ? data.location.lat : defaultDestination[0];
          const destLng = typeof data.location?.lng === 'number' && data.location.lng !== 0 ? data.location.lng : defaultDestination[1];

          setDestination(destinationAddress);
          setUserLocation({ lat: destLat, lng: destLng });

          // Extract populated mechanic details dynamically from the order
          let mechLat = defaultOrigin[0];
          let mechLng = defaultOrigin[1];

          if (data.mechanicId && typeof data.mechanicId === 'object') {
            const m = data.mechanicId;
            if (typeof m.currentLocation?.lat === 'number' && m.currentLocation.lat !== 0) {
              mechLat = m.currentLocation.lat;
            }
            if (typeof m.currentLocation?.lng === 'number' && m.currentLocation.lng !== 0) {
              mechLng = m.currentLocation.lng;
            }

            const specialties = Array.isArray(m.serviceCategories) && m.serviceCategories.length > 0
              ? m.serviceCategories.join(' • ')
              : m.specialization || 'Certified Roadside Specialist';

            setMechanic({
              name: m.name || 'Certified Technician',
              specialty: specialties,
              hub: m.workshopName || 'FixOnRoad Certified Partner Garage',
              vehicle: m.vehiclePlate ? `Vehicle (${m.vehiclePlate})` : 'Rapid Response Unit',
              phone: m.phone || '+91 98001 12233',
              rating: typeof m.rating === 'number' && m.rating > 0 ? m.rating : 4.9,
              originLat: mechLat,
              originLng: mechLng
            });
          }

          const dist = calculateDistance(mechLat, mechLng, destLat, destLng);
          setDistance(dist);
          // 1 km ~ 2.5 mins in typical traffic, min 5 mins
          setEta(Math.max(5, Math.round(Number(dist) * 2.5)));
        }
      } catch (err) {
        console.error("Failed to fetch order status", err);
      }
    };
    
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setEta((prev) => Math.max(1, prev - 1));
    }, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col">
      <Navbar variant="rider" />
      <div className="flex-1 flex flex-col pt-24 px-4 pb-10 max-w-4xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center text-orange-500 hover:text-orange-400 mb-6 font-semibold">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
        </Link>
        
        <div className="bg-[#121824] rounded-3xl border border-slate-800 p-6 md:p-10 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-['Outfit']">Live Tracking</h1>
              <p className="text-slate-400 text-sm mt-1">Order #{orderId?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex gap-6 items-center">
              <div className="text-right">
                <div className="text-slate-400 text-sm font-medium mb-1">Distance</div>
                <div className="text-xl font-bold">{distance} km</div>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div className="text-right">
                <div className="text-3xl font-extrabold text-orange-500">{eta} min</div>
                <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                  paymentStatus === 'PAID'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {paymentStatus === 'PAID' ? 'PAID ONLINE (VERIFIED)' : 'CASH ON ARRIVAL'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
            
            {/* Left: Mechanic Info & Route Details */}
            <div className="flex flex-col gap-4">
               {/* Mechanic Profile */}
               <div className="bg-[#0B0F17] rounded-2xl border border-slate-800 p-5 flex items-start gap-4">
                 <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-orange-500/30">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mechanic.name)}&background=f97316&color=fff&bold=true`} 
                      alt={mechanic.name} 
                      className="w-full h-full object-cover" 
                    />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h3 className="font-bold text-lg truncate text-white">{mechanic.name}</h3>
                   <div className="text-sm text-slate-400 mb-2 truncate">{mechanic.specialty} • {mechanic.rating} ★</div>
                   <div className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-md text-xs font-medium border border-orange-500/20">
                     {mechanic.vehicle}
                   </div>
                 </div>
                 <a 
                   href={`tel:${mechanic.phone}`}
                   className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition-colors shrink-0 border border-emerald-500/20"
                   title={`Call ${mechanic.name}`}
                 >
                   <PhoneCall className="w-5 h-5" />
                 </a>
               </div>

               {/* Route Timeline */}
               <div className="bg-[#0B0F17] rounded-2xl border border-slate-800 p-6 flex-1">
                 <h4 className="font-semibold mb-6 flex items-center gap-2">
                   <Navigation2 className="w-4 h-4 text-orange-500" /> Route Details
                 </h4>
                 
                 <div className="relative pl-6 space-y-8">
                   <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800" />
                   
                   <div className="relative z-10">
                     <div className="absolute -left-6 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#0B0F17]" />
                     <p className="text-xs text-orange-400 font-bold mb-1 uppercase tracking-wider">Starting Origin</p>
                     <p className="text-sm font-medium">{mechanic.hub}</p>
                     <p className="text-xs text-slate-400 mt-0.5">Dispatched & on the way</p>
                   </div>

                   <div className="relative z-10 mt-3">
                     <div className="absolute -left-6 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0F17]" />
                     <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">Your Location</p>
                     <p className="text-sm font-medium text-white mt-1 line-clamp-2">{destination}</p>
                   </div>
                 </div>
               </div>
            </div>

            {/* Right: Map Visualization */}
            <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F17] relative">
              {userLocation ? (
                <MapContainer 
                  center={[(mechanic.originLat + userLocation.lat) / 2, (mechanic.originLng + userLocation.lng) / 2]} 
                  zoom={11} 
                  className="w-full h-full min-h-[380px] z-10"
                  scrollWheelZoom={false}
                >
                  {/* Dark theme tile layer via OSM + CSS Invert (Guaranteed free, no watermarks) */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles"
                  />
                  <style>{`
                    .map-tiles {
                      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                    }
                  `}</style>
                  <Marker position={[mechanic.originLat, mechanic.originLng]}>
                    <Popup className="font-['Outfit']">
                      <strong>{mechanic.name}</strong><br/>
                      {mechanic.hub}<br/>
                      <span className="text-xs text-orange-500">{mechanic.specialty}</span>
                    </Popup>
                  </Marker>
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup className="font-['Outfit']">
                      <strong>Your Location</strong>
                    </Popup>
                  </Marker>
                  <Polyline 
                    positions={[[mechanic.originLat, mechanic.originLng], [userLocation.lat, userLocation.lng]]}
                    pathOptions={{ color: '#f97316', dashArray: '8, 8', weight: 4 }}
                  />
                </MapContainer>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                   Loading real-time map...
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer variant="rider" />
    </div>
  );
}
