# Kitchen IoT Hub

A comprehensive IoT solution using ESP32 and React Native for kitchen management including dishwasher status tracking, timer functionality, and shopping list management.

## Features

### Currently Implemented
- **Dishwasher Status Tracking:** Physical button and mobile controls for clean/dirty status
- **Cooking Timer:** ESP32 button and mobile controls starts/stops timer with push notifications when complete
- **Multi-user Synchronization:** Real-time status updates across all connected devices
- **Cross-platform Mobile Interface:** Haptic feedback and responsive design
- **RESTful API Design:** Proper CORS support for web integration
- **Shopping List:** Firestore database persistence with real-time updates

### In Development
- **Dishwasher Cycle Timer:** Track full dishwasher cycles with completion alerts
- **Timer Synchronization:** All connected phones show the same timer state

## Tech Stack
- **Hardware:** ESP32 microcontroller, GPIO LEDs, tactile buttons
- **Backend:** ESP32 web server with RESTful API endpoints
- **Frontend:** React Native with Expo, real-time polling
- **Communication:** WiFi HTTP requests, JSON API responses
- **Storage:** ESP32 EEPROM/Flash for persisting dishwasher status, Firestore for shopping list data

