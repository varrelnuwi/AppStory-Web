// src/components/map.js
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// ✅ Fix icon path agar muncul di Webpack build
L.Icon.Default.mergeOptions({
  iconUrl,
  shadowUrl: iconShadow,
});

let mapInstance = null;
let markersLayer = null;

export function createMap({ elementId = 'map', center = [-2.5, 118], zoom = 5 } = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // ✅ Styling agar tidak meniban header
  el.style.width = '100%';
  el.style.height = el.style.height || '400px';
  el.style.marginTop = '80px';
  el.style.position = 'relative';
  el.style.zIndex = '0';

  // Jika map sudah ada, hanya resize ulang
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
    return mapInstance;
  }

  // Buat peta baru
  mapInstance = L.map(elementId, {
    zoomControl: true,
  }).setView(center, zoom);

  // Tile layer OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap Contributors'
  }).addTo(mapInstance);

  // Marker group
  markersLayer = L.layerGroup().addTo(mapInstance);

  return mapInstance;
}

// Tambah marker
export function addMarker({ lat, lng, title = '', popupHtml = '' }) {
  if (!mapInstance) return;
  const marker = L.marker([lat, lng], { title });
  if (popupHtml) marker.bindPopup(popupHtml);
  marker.addTo(markersLayer);
  return marker;
}

// Bersihkan semua marker
export function clearMarkers() {
  if (markersLayer) markersLayer.clearLayers();
}

// Auto zoom ke semua marker
export function fitMapToMarkers() {
  if (!mapInstance || !markersLayer) return;
  const layers = markersLayer.getLayers();
  if (!layers.length) return;
  const bounds = L.featureGroup(layers).getBounds();
  mapInstance.fitBounds(bounds.pad(0.2));
}

// Hapus instance map
export function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markersLayer = null;
  }
}
