import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapView({ centers }) {
  // Default center (Ahmedabad). You can change this.
  const defaultPosition = [23.0225, 72.5714];

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultPosition}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {centers.map((center) => (
          // For now we use a fixed position near the city.
          // Later you can store real lat/lng in the database.
          <Marker
            key={center._id}
            position={[
              defaultPosition[0] + (Math.random() - 0.5) * 0.05,
              defaultPosition[1] + (Math.random() - 0.5) * 0.05
            ]}
          >
            <Popup>
              <strong>{center.name}</strong>
              <br />
              {center.address}
              <br />
              {center.type} | {center.facilities}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;