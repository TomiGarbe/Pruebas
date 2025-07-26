// firebase-messaging-sw.js
importScripts('/firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

firebase.initializeApp(self.FIREBASE_CONFIG);

const messaging = firebase.messaging();
const shownNotifications = new Set(); // Track shown notifications

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', JSON.stringify(payload));
    console.log('Message ID:', payload.messageId || 'No messageId');
    try {
        const notificationTitle = payload.notification?.title || payload.data?.title || 'Notification';
        const notificationBody = payload.notification?.body || payload.data?.body || 'No body';
        const notificationTag = payload.messageId || `${notificationTitle}:${notificationBody}:${Date.now()}`; // Unique tag with timestamp

        if (shownNotifications.has(notificationTag)) {
            console.log('Duplicate notification detected, skipping:', notificationTag);
            return;
        }

        const notificationOptions = {
            body: notificationBody,
            icon: '/icons/icon-192x192.png',
            tag: notificationTag
        };
        console.log('Showing notification:', notificationTitle, notificationOptions);
        self.registration.showNotification(notificationTitle, notificationOptions);
        shownNotifications.add(notificationTag);
        // Clear old tags to prevent memory growth
        setTimeout(() => shownNotifications.delete(notificationTag), 60000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});

// Network-first fetch handler for same-origin requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});