// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

firebase.initializeApp(self.FIREBASE_CONFIG);

const messaging = firebase.messaging();

// Prevent duplicate notifications
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico',
        tag: payload.notification.title // Use a unique tag to prevent duplicates
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});