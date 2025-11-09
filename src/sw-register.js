// src/sw-register.js
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    // ✅ Gunakan path absolut agar tidak 404 di dev (webpack)
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered:', registration);

    // 🔁 Jika ada update baru
    registration.onupdatefound = () => {
      console.log('🔁 Service Worker update found');
    };

    // 🔔 Push & network status handler
    setupPushToggle(registration);
    setupOnlineStatus();
  } catch (err) {
    console.warn('❌ SW registration failed:', err);
  }
}

// ✅ Push Notification Toggle
async function setupPushToggle(registration) {
  const btn = document.getElementById('pushToggle');
  if (!btn) return;

  const sub = await registration.pushManager.getSubscription();
  let isSub = !!sub;
  btn.textContent = isSub ? 'Disable Notifications' : 'Enable Notifications';

  btn.onclick = async () => {
    try {
      if (isSub && sub) {
        await sub.unsubscribe();
        isSub = false;
        btn.textContent = 'Enable Notifications';
        alert('Push notification disabled');
      } else {
        // ⚠️ Ganti dengan VAPID key milikmu dari server/API
        const vapidKey = 'YOUR_PUBLIC_VAPID_KEY_FROM_API';
        const converted = urlBase64ToUint8Array(vapidKey);
        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: converted,
        });
        console.log('📬 New Push Subscription:', newSub);
        isSub = true;
        btn.textContent = 'Disable Notifications';
        alert('Push notification enabled!');
      }
    } catch (err) {
      console.error('❌ Push toggle failed:', err);
      alert('Gagal mengubah status push notification.');
    }
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ✅ Online/Offline status indicator
function setupOnlineStatus() {
  const indicator = document.getElementById('networkStatus');
  if (!indicator) return;

  const update = () => {
    const online = navigator.onLine;
    indicator.textContent = online ? '🟢 Online' : '🔴 Offline';
    indicator.style.color = online ? 'green' : 'red';
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

// ✅ Jalankan otomatis
registerServiceWorker();
