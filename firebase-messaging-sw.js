{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');\
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');\
\
firebase.initializeApp(\{\
    apiKey: "AIzaSyDCQmIYiXHrB7etNeGE9FF0MioWNBe8lTg",\
    projectId: "yawr-87344",\
    messagingSenderId: "501852054054",\
    appId: "1:501852054054:web:be39ee4f40a6e035d53ce7"\
\});\
\
const messaging = firebase.messaging();\
\
messaging.onBackgroundMessage((payload) => \{\
    const notificationTitle = payload.notification.title || "sidequest central";\
    const notificationOptions = \{\
        body: payload.notification.body,\
        icon: "/favicon.ico"\
    \};\
\
    self.registration.showNotification(notificationTitle, notificationOptions);\
\});}
