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
  
  // Also keep some outside Gujarat
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  pune: [18.5204, 73.8567]
};

function MapView({ centers, city }) {
  const cityKey = (city || 'ahmedabad').toLowerCase().trim();
  const defaultPosition = cityCoordinates[cityKey] || cityCoordinates['ahmedabad'];

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        key={cityKey} // important: re-render map when city changes
        center={defaultPosition}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {centers.map((center, index) => (
          <Marker
            key={center._id}
            position={[
              defaultPosition[0] + (Math.random() - 0.5) * 0.04,
              defaultPosition[1] + (Math.random() - 0.5) * 0.04
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