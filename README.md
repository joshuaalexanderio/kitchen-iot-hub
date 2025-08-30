# Kitchen IoT Hub

A comprehensive IoT kitchen management system built with ESP32 and React Native, featuring dishwasher status monitoring, smart timers, and shopping list management.


https://github.com/user-attachments/assets/f1768ebc-90a7-4762-84bc-340c5aa99274

[Live Demo](https://youtu.be/RkhE9cLfJ8Y)

## Features

- **Dishwasher Status Tracking:** Physical button and mobile controls for toggling clean/dirty status
- **Cooking Timer:** Microcontroller button and mobile controls starts/stops timer with push notifications when complete
- **Shopping List:** Firestore database persistence with real-time updates
- **Multi-user Synchronization:** Real-time status updates, timer and shopping list synched between users
- **Cross-platform Mobile Interface:** Haptic feedback and responsive design on both iOS and Android
- **RESTful API Design:** Proper CORS support for web integration

### To Do
- **Dishwasher Cycle Timer:** Track full dishwasher cycles with completion alerts
- **Timer Selector**: Implement analog knob with OLED screen for timer duration presets

## Tech Stack
- **Hardware:** ESP32 microcontroller, GPIO LEDs, tactile buttons
- **Backend:** ESP32 web server with RESTful API endpoints
- **Frontend:** React Native with Expo, real-time polling
- **Communication:** WiFi HTTP requests, JSON API responses
- **Storage:** ESP32 EEPROM/Flash for persisting dishwasher status, Firestore for shopping list data

