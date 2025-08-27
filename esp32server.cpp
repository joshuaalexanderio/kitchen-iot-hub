// Server code to be uploaded and ran on ESP-32
// Wire green LED to GPIO 18 for "clean"
// Wire red LED to GPIO 19 for "dirty"
// Wire button to GPIO 21 to toggle LEDs

#include <WiFi.h>
#include <ArduinoJson.h>
#include<ESPmDNS.h>

// REPLACE WITH YOUR NETWORK CREDENTIALS BEFORE UPLOADING
const char* ssid = "YOUR_WIFI_NETWORK";
const char* password = "YOUR_WIFI_PASSWORD";


// Set web server port number to 80
WiFiServer server(80);

// Variable to store the HTTP request
String header;

// Auxiliar variables to store the current output state
String redLightState = "off";
String greenLightState = "off";

// Assign output variables to GPIO pins
const int redLight = 18;
const int greenLight = 19;
const int lightToggle = 21;
const int timerButton = 22;

// Current time
unsigned long currentTime = millis();
// Previous time
unsigned long previousTime = 0;
// Define timeout time in milliseconds
const long timeoutTime = 2000;

// Network configuration - adjust for your network
IPAddress local_IP(192, 168, 1, 100);      // Change to your desired IP
IPAddress gateway(192, 168, 1, 1);         // Change to your router IP
IPAddress subnet(255, 255, 255, 0);

void setup() {
 if (!WiFi.config(local_IP, gateway, subnet)) {
  Serial.println("Static IP configuration failed");
}

  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(redLight, OUTPUT);
  pinMode(greenLight, OUTPUT);

  // Set outputs to LOW
  digitalWrite(redLight, LOW);
  digitalWrite(greenLight, LOW);

  // Connect to Wi-Fi network with SSID and password
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Print local IP address and start web server
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.println("\nAPI Endpoints:");
  Serial.println("GET  /api/lights - Get all light states");
  Serial.println("POST /api/lights/red/on - Turn red light ON");
  Serial.println("POST /api/lights/red/off - Turn red light OFF");
  Serial.println("POST /api/lights/green/on - Turn green light ON");
  Serial.println("POST /api/lights/green/off - Turn green light OFF");

  server.begin();
}

void loop(){
  WiFiClient client = server.available();

  if (client) {
    currentTime = millis();
    previousTime = currentTime;
    Serial.println("New API Client.");
    String currentLine = "";
    String requestBody = "";
    bool isPostRequest = false;
    int contentLength = 0;

    while (client.connected() && currentTime - previousTime <= timeoutTime) {
      currentTime = millis();
      if (client.available()) {
        char c = client.read();
        header += c;

        if (c == '\n') {
          if (currentLine.length() == 0) {
            // End of headers, handle the request
            handleAPIRequest(client, header, requestBody);
            break;
          } else {
            // Check for POST request and Content-Length
            if (currentLine.startsWith("POST")) {
              isPostRequest = true;
            }
            if (currentLine.startsWith("Content-Length: ")) {
              contentLength = currentLine.substring(16).toInt();
            }
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }

    // Clear the header variable
    header = "";
    // Close the connection
    client.stop();
    Serial.println("API Client disconnected.\n");
  }
}

void handleAPIRequest(WiFiClient& client, String& request, String& body) {
  // Set CORS headers to allow cross-origin requests
  String response = "HTTP/1.1 ";
  String contentType = "Content-Type: application/json\r\n";
  String corsHeaders = "Access-Control-Allow-Origin: *\r\n";
  corsHeaders += "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
  corsHeaders += "Access-Control-Allow-Headers: Content-Type\r\n";

  // Handle OPTIONS request for CORS preflight
  if (request.indexOf("OPTIONS") >= 0) {
    response += "200 OK\r\n";
    response += corsHeaders;
    response += "Content-Length: 0\r\n\r\n";
    client.print(response);
    return;
  }

  // GET /api/lights - Return current state of all lights
  if (request.indexOf("GET /api/lights") >= 0) {
    response += "200 OK\r\n";
    response += contentType;
    response += corsHeaders;
    response += "\r\n";

    // Create JSON response
    DynamicJsonDocument doc(200);
    doc["status"] = "success";
    JsonObject lights = doc.createNestedObject("lights");
    lights["red light"] = redLightState;
    lights["green light"] = greenLightState;

    String jsonString;
    serializeJson(doc, jsonString);
    response += jsonString;

    client.print(response);
    Serial.println("Sent light states");
    return;
  }

  // POST requests for controlling lights
  bool validRequest = false;
  String responseMessage = "";

  if (request.indexOf("POST /api/lights/red/on") >= 0) {
    digitalWrite(redLight, HIGH);
    redLightState = "on";
    responseMessage = "Red light (GPIO18) turned ON";
    validRequest = true;
    Serial.println("API: Red light (GPIO18) turned ON");

  } else if (request.indexOf("POST /api/lights/red/off") >= 0) {
    digitalWrite(redLight, LOW);
    redLightState = "off";
    responseMessage = "Red light (GPIO18) OFF";
    validRequest = true;
    Serial.println("API: Red light (GPIO18) turned OFF");

  } else if (request.indexOf("POST /api/lights/green/on") >= 0) {
    digitalWrite(greenLight, HIGH);
    greenLightState = "on";
    responseMessage = "Green light (GPIO19) turned ON";
    validRequest = true;
    Serial.println("API: Green light (GPIO19) turned ON");

  } else if (request.indexOf("POST /api/lights/green/off") >= 0) {
    digitalWrite(greenLight, LOW);
    greenLightState = "off";
    responseMessage = "Green light (GPIO19) turned OFF";
    validRequest = true;
    Serial.println("API: Green light (GPIO19) turned OFF");
  }

  if (validRequest) {
    response += "200 OK\r\n";
    response += contentType;
    response += corsHeaders;
    response += "\r\n";

    // Create success JSON response
    DynamicJsonDocument doc(200);
    doc["status"] = "success";
    doc["message"] = responseMessage;
    JsonObject lights = doc.createNestedObject("lights");
    lights["red light"] = redLightState;
    lights["green light"] = greenLightState;

    String jsonString;
    serializeJson(doc, jsonString);
    response += jsonString;

  } else {
    // Invalid endpoint
    response += "404 Not Found\r\n";
    response += contentType;
    response += corsHeaders;
    response += "\r\n";

    DynamicJsonDocument doc(150);
    doc["status"] = "error";
    doc["message"] = "Endpoint not found";

    String jsonString;
    serializeJson(doc, jsonString);
    response += jsonString;
  }

  client.print(response);
}