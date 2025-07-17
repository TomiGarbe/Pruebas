importScripts('/firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');

firebase.initializeApp(self.FIREBASE_CONFIG);
const messaging = firebase.messaging();

console.log('Service Worker registered for FCM at:', self.location.href);
messaging.onBackgroundMessage(function(payload) {
    console.log('Background message received:', payload);
    if (payload.data) console.log('Data:', payload.data);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/favicon.ico',
        data: payload.data
    });
});
messaging.onMessage(function(payload) {
    console.log('Foreground message received:', payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/favicon.ico',
        data: payload.data
    });
});