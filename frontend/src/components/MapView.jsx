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

import { cityCoordinates } from '../utils/geoDistance';

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