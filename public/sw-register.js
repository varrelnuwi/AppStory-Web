// public/sw-register.js
// ✅ Registrasi Service Worker + Push Notification + Online Status (FINAL)

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    // ✅ Gunakan path relatif agar berfungsi di localhost & GitHub Pages
    const registration = await navigator.serviceWorker.register('./sw.js');
    console.log('✅ Service Worker registered:', registration);

    // 🩵 FIX redundant SW
    if (registration.active && registration.active.state === 'redundant') {
      console.warn('⚠️ SW redundant detected. Unregistering old version...');
      await registration.unregister();
      window.location.reload();
      return;
    }

    await waitUntilActive(registration);

    registration.onupdatefound = () => {
      console.log('🔁 Service Worker update found');
    };

    // 🔔 Push + network
    setupPushToggle(registration);
    setupOnlineStatus();
  } catch (err) {
    console.warn('❌ SW registration failed:', err);
  }
}

async function waitUntilActive(registration) {
  if (registration.active) return;
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (registration.active) {
        clearInterval(interval);
        resolve();
      }
    }, 300);
  });
}

// ✅ Push Notification Toggle
async function setupPushToggle(registration) {
  // Tunggu tombol muncul di DOM
  let btn;
  for (let i = 0; i < 20; i++) {
    btn = document.getElementById('pushToggle');
    if (btn) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!btn) {
    console.warn('⚠️ pushToggle button not found in DOM');
    return;
  }

  // Pastikan izin notifikasi
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  const sub = await registration.pushManager.getSubscription();
  let isSub = !!sub;
  updateButtonUI(btn, isSub);

  btn.onclick = async () => {
    try {
      if (isSub && sub) {
        await sub.unsubscribe();
        isSub = false;
        updateButtonUI(btn, isSub);
        alert('Push notification disabled');
      } else {
        const vapidKey =
          'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
        const converted = urlBase64ToUint8Array(vapidKey);
        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: converted,
        });
        console.log('📬 New Push Subscription:', newSub);
        isSub = true;
        updateButtonUI(btn, isSub);

        registration.showNotification('Push Aktif 🎉', {
          body: 'Push notification berhasil diaktifkan!',
          icon: './icons/checklist.png',
        });
      }
    } catch (err) {
      console.error('❌ Push toggle failed:', err);
      alert('Gagal mengubah status push notification.');
    }
  };
}

// 🔧 Helper untuk update tampilan tombol
function updateButtonUI(btn, isSub) {
  localStorage.setItem('pushEnabled', isSub ? 'true' : 'false');
  btn.textContent = isSub ? '🔔 Notifikasi ON' : '🔕 Notifikasi OFF';
  btn.className = isSub ? 'btn-alt active' : 'btn-alt';
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

// ✅ Online/Offline indicator
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
