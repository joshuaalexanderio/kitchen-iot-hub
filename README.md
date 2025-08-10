# Kitchen IoT Hub

A comprehensive IoT solution using ESP32 and React Native for kitchen management including dishwasher status tracking, timer functionality, and shopping list management.

## Features

### Currently Implemented
- Dishwasher status tracking with physical button and mobile controls
- Multi-user synchronization with real-time status updates
- Cross-platform mobile interface with haptic feedback
- RESTful API design with proper CORS support

### In Development
- **DIshwasher Cycle Timer:** Track full dishwasher cycles with completion alerts
- **Cooking Timer:** Physical ESP32 button starts/stops timer with push notifications when complete
- **Persistent Shopping List:** Add/remove items with ESP32 storage
- **Timer Synchronization:** All connected phones show the same timer state
- **Enhanced Mobile UI:** Tabbed interface for status/timer/shopping features

## Tech Stack
- **Hardware:** ESP32 microcontroller, GPIO LEDs, tactile buttons
- **Backend:** ESP32 web server with RESTful API endpoints
- **Frontend:** React Native with Expo, real-time polling
- **Communication:** WiFi HTTP requests, JSON API responses
- **Storage:** ESP32 EEPROM/Flash for persistent data

