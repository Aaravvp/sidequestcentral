importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDCQmIYiXHrB7etNeGE9FF0MioWNBe8lTg",
    projectId: "yawr-87344",
    messagingSenderId: "501852054054",
    appId: "1:501852054054:web:be39ee4f40a6e035d53ce7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || "sidequest central";
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/favicon.ico"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
