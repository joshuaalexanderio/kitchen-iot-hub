// Server code to be uploaded and ran on ESP-32
// Wire green LED to GPIO 18 for "clean"
// Wire red LED to GPIO 19 for "dirty"
// Wire button to GPIO 21 to toggle LEDs

#include <WiFi.h>
#include <ArduinoJson.h>

// REPLACE WITH NETWORK CREDENTIALS
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Set web server port number to 80
WiFiServer server(80);

// Variable to store the HTTP request
String header;

// Auxiliar variables to store the current output state
String output18State = "off";
String output19State = "off";

// Assign output variables to GPIO pins
const int output18 = 18;
const int output19 = 19;

// Current time
unsigned long currentTime = millis();
// Previous time
unsigned long previousTime = 0;
// Define timeout time in milliseconds
const long timeoutTime = 2000;

void setup() {
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output18, OUTPUT);
  pinMode(output19, OUTPUT);

  // Set outputs to LOW
  digitalWrite(output18, LOW);
  digitalWrite(output19, LOW);

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
  Serial.println("POST /api/lights/18/on - Turn light 18 ON");
  Serial.println("POST /api/lights/18/off - Turn light 18 OFF");
  Serial.println("POST /api/lights/19/on - Turn light 19 ON");
  Serial.println("POST /api/lights/19/off - Turn light 19 OFF");

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
    lights["18"] = output18State;
    lights["19"] = output19State;

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

  if (request.indexOf("POST /api/lights/18/on") >= 0) {
    digitalWrite(output18, HIGH);
    output18State = "on";
    responseMessage = "Light 18 turned ON";
    validRequest = true;
    Serial.println("API: GPIO 18 ON");

  } else if (request.indexOf("POST /api/lights/18/off") >= 0) {
    digitalWrite(output18, LOW);
    output18State = "off";
    responseMessage = "Light 18 turned OFF";
    validRequest = true;
    Serial.println("API: GPIO 18 OFF");

  } else if (request.indexOf("POST /api/lights/19/on") >= 0) {
    digitalWrite(output19, HIGH);
    output19State = "on";
    responseMessage = "Light 19 turned ON";
    validRequest = true;
    Serial.println("API: GPIO 19 ON");

  } else if (request.indexOf("POST /api/lights/19/off") >= 0) {
    digitalWrite(output19, LOW);
    output19State = "off";
    responseMessage = "Light 19 turned OFF";
    validRequest = true;
    Serial.println("API: GPIO 19 OFF");
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
    lights["18"] = output18State;
    lights["19"] = output19State;

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