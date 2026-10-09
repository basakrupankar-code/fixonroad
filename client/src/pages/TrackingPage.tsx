import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, PhoneCall, ChevronLeft, Navigation2 } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const kalyaniCoords = [22.9772, 88.4312]; // Kalyani Central Park
  const samudragarCoords = [23.3644, 88.3182]; // Samudragar breakdown location
  const initialDistance = calculateDistance(kalyaniCoords[0], kalyaniCoords[1], samudragarCoords[0], samudragarCoords[1]); // returns ~41.7
  const calculatedEta = Math.round(Number(initialDistance) * 2.5); // ~104 min

  const [eta, setEta] = useState<number>(calculatedEta);
  const [status, setStatus] = useState('Mechanic Assigned');
  const [distance, setDistance] = useState<string>(initialDistance);
  const destinationLabel = 
    localStorage.getItem('user_city') || 
    localStorage.getItem('user_address') || 
    'Samudragar, West Bengal';
  const [destination, setDestination] = useState<string>(destinationLabel);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({ lat: samudragarCoords[0], lng: samudragarCoords[1] });

  const mechanic = {
    name: "Sanjay Das",
    specialty: "Bike & Car Specialist",
    hub: "Kalyani Central Park Auto Hub",
    vehicle: "Hero Splendor (WB-24-9812)",
    phone: "+91 98765 43210",
    rating: 4.9,
    originLat: kalyaniCoords[0],
    originLng: kalyaniCoords[1]
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/v1/bookings/${orderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStatus(data.status ? data.status.replace('_', ' ') : 'MECHANIC ASSIGNED');
            
            // Extract location
            const address = data.location?.address || data.address;
            const destinationAddress = 
              address || 
              localStorage.getItem('breakdown_address') || 
              'Samudragar, West Bengal';

            const destinationCoords = 
              (data.location?.lat && data.location?.lng) 
                ? [data.location.lat, data.location.lng] 
                : (destinationAddress.toLowerCase().includes('samudragar') 
                    ? [23.3644, 88.3182] 
                    : [23.3644, 88.3182]); // Default fallback to breakdown site, NOT live IP

            const originCoords = [22.9772, 88.4312]; // Kalyani Central Park Auto Hub

            setDestination(destinationAddress);
            setUserLocation({ lat: destinationCoords[0], lng: destinationCoords[1] });
            
            const dist = calculateDistance(originCoords[0], originCoords[1], destinationCoords[0], destinationCoords[1]);
            setDistance(dist);
            // rough estimate: 1 km = 3 mins in city traffic
            setEta(Math.max(5, Math.round(Number(dist) * 3)));
          }
        }
      } catch (err) {
        console.error("Failed to fetch order status", err);
      }
    };
    
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setEta((prev) => Math.max(1, prev - 1));
    }, 15000); // Polling every 15s is safer
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
                <span className="inline-block mt-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                  NOT PAID (CASH ON ARRIVAL)
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
                    <img src="https://ui-avatars.com/api/?name=Sanjay+Das&background=f97316&color=fff" alt="Mechanic" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-lg">{mechanic.name}</h3>
                   <div className="text-sm text-slate-400 mb-2">{mechanic.specialty} • {mechanic.rating} ★</div>
                   <div className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-md text-xs font-medium border border-orange-500/20">
                     {mechanic.vehicle}
                   </div>
                 </div>
                 <button className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition-colors">
                   <PhoneCall className="w-5 h-5" />
                 </button>
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
                      <strong>Starting Origin</strong><br/>
                      {mechanic.hub}
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
