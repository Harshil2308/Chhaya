import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom user location pin icon
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #2563eb;
    border: 3px solid white;
    box-shadow: 0 0 10px rgba(37,99,235,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
  "><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// City coordinates
const cityCoordinates = {
  // Major cities
  ahmedabad: [23.0225, 72.5714],
  vadodara: [22.3072, 73.1812],
  surat: [21.1702, 72.8311],
  rajkot: [22.3039, 70.8022],
  bhavnagar: [21.7645, 72.1519],
  jamnagar: [22.4707, 70.0577],
  junagadh: [21.5222, 70.4579],
  gandhinagar: [23.2156, 72.6369],
  anand: [22.5645, 72.9289],
  nadiad: [22.6939, 72.8616],
  mehsana: [23.5880, 72.3693],
  morbi: [22.8173, 70.8340],
  surendranagar: [22.7703, 71.6750],
  gandhidham: [23.0753, 70.1337],
  bharuch: [21.7051, 72.9959],
  valsad: [20.5992, 72.9342],
  vapi: [20.3710, 72.9040],
  navsari: [20.9467, 72.9520],
  godhra: [22.7772, 73.6201],
  patan: [23.8493, 72.1266],
  palanpur: [24.1724, 72.4346],
  bhuj: [23.2420, 69.6669],
  porbandar: [21.6417, 69.6293],
  veraval: [20.9159, 70.3629],
  botad: [22.1704, 71.6664],
  amreli: [21.6032, 71.2221],
  dahod: [22.8320, 74.2599],
  himatnagar: [23.5970, 72.9650],
  
  // Outside Gujarat
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  pune: [18.5204, 73.8567]
};

function MapView({ centers = [], city = '', userCoords = null }) {
  const cityKey = (city || 'ahmedabad').toLowerCase().trim();
  const defaultPosition = userCoords
    ? [userCoords.lat, userCoords.lng]
    : (cityCoordinates[cityKey] || cityCoordinates['ahmedabad']);

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        key={`${cityKey}-${userCoords ? `${userCoords.lat},${userCoords.lng}` : 'static'}`}
        center={defaultPosition}
        zoom={userCoords ? 13 : 12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User live position marker */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userLocationIcon}>
            <Popup>
              <strong>📍 You are here</strong>
              <br />
              <span className="text-xs text-blue-600 font-semibold">Your Current Location</span>
            </Popup>
          </Marker>
        )}

        {/* Cooling centers */}
        {centers.map((center, index) => {
          const hasExactCoords = center.latitude != null && center.longitude != null &&
            !isNaN(center.latitude) && !isNaN(center.longitude);

          const position = hasExactCoords
            ? [center.latitude, center.longitude]
            : [
                defaultPosition[0] + ((index % 5) - 2) * 0.012,
                defaultPosition[1] + (Math.floor(index / 5) - 1) * 0.015
              ];

          const destCoords = hasExactCoords
            ? `${center.latitude},${center.longitude}`
            : encodeURIComponent(`${center.name}, ${center.address}, ${center.city}`);

          return (
            <Marker key={center._id || index} position={position}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: '#1f2937', fontSize: 13 }}>{center.name}</strong>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{center.address}</div>
                  <div style={{ fontSize: 11, color: '#e06010', fontWeight: 600, marginTop: 2 }}>
                    {center.type} · {center.facilities}
                  </div>
                  {center.distanceKm != null && (
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 3 }}>
                      📍 {center.distanceKm} km away
                    </div>
                  )}
                  <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid #f3f4f6' }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${destCoords}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', fontWeight: 600, fontSize: 11, textDecoration: 'none' }}
                    >
                      🧭 Get Directions →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapView;