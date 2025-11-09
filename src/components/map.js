import L from 'leaflet';

let mapInstance = null;
let markersLayer = null;

export function createMap({ elementId = 'map', center = [-2.5, 118], zoom = 5 } = {}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Jika map sudah ada, return saja
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
    return mapInstance;
  }

  // Buat peta baru
  mapInstance = L.map(elementId).setView(center, zoom);

  // Tile
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
  const marker = L.marker([lat, lng]);
  if (popupHtml) marker.bindPopup(popupHtml);
  marker.addTo(markersLayer);
  return marker;
}

// Bersihkan semua marker dalam map
export function clearMarkers() {
  if (markersLayer) markersLayer.clearLayers();
}

// Auto zoom semua marker
export function fitMapToMarkers() {
  if (!mapInstance || !markersLayer) return;
  const layers = markersLayer.getLayers();
  if (!layers.length) return;
  const bounds = L.featureGroup(layers).getBounds();
  mapInstance.fitBounds(bounds.pad(0.2));
}

// ✅ Tambahan untuk hapus warning DOM
export function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markersLayer = null;
  }
}
