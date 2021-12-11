#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Arduino.h>
#include <Adafruit_GFX.h>    // Core graphics library
#include <Adafruit_ST7735.h> // Hardware-specific library for ST7735
#include <Adafruit_ST7789.h> // Hardware-specific library for ST7789
#include <SPI.h>

//pin for ESP32
  #define TFT_CS        5
  #define TFT_RST       4
  #define TFT_DC        2


// For 1.44" and 1.8" TFT with ST7735 use:
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
float p = 3.1415926;

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
BLECharacteristic *lightCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t valueSensorSoil = 0;
uint8_t sensor_pinSoil = 35;

uint32_t valueSensorLight = 0;
uint8_t sensor_pinLight = 34;

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_UUID_LIGHT "a1bee35a-5ab9-11ec-bf63-0242ac130002"

class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    deviceConnected = true;
  };

  void onDisconnect(BLEServer *pServer)
  {
    deviceConnected = false;
  }
};

void eyes()
{
  //EYES
  tft.fillCircle(43, 50, 8, ST77XX_WHITE);
  tft.fillCircle(85, 50, 8, ST77XX_WHITE);
  delay(5000);
  tft.fillCircle(43, 50, 8, ST77XX_BLACK);
  tft.fillCircle(85, 50, 8, ST77XX_BLACK);
}

void mouth() 
{
  // MOUTH
  tft.fillCircle(64, 80, 32, ST77XX_WHITE);
  tft.fillCircle(64, 50, 42, ST77XX_BLACK);
}

void setup()
{
  Serial.begin(9600);
  Serial.print(F("Hello! ST77xx TFT Test"));

  //DISPLAY
  // Use this initializer if using a 1.8" TFT screen:
  tft.initR(INITR_BLACKTAB); // Init ST7735S chip, black tab
  Serial.println("Initialized");

  //BLUETOOTH
  // Create the BLE Device
  BLEDevice::init("ESP32");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic( CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  lightCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_LIGHT, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0); // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting a client connection to notify...");


  uint16_t time = millis();
  tft.fillScreen(ST77XX_BLACK);
  time = millis() - time;

  tft.fillScreen(ST77XX_BLACK);
  mouth();
}

void loop()
{
  // notify changed value
  if (deviceConnected)
  {
    //soil
    valueSensorSoil = analogRead(sensor_pinSoil);
    pCharacteristic->setValue(valueSensorSoil);
    Serial.println(valueSensorSoil);
    pCharacteristic->notify();
    delay(500); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms

    //light
    valueSensorLight = analogRead(sensor_pinLight);
    lightCharacteristic->setValue(valueSensorLight);
    Serial.println(valueSensorLight);
    pCharacteristic->notify();
    delay(500);
  }
  // disconnecting
  if (!deviceConnected && oldDeviceConnected)
  {
    delay(500);                  // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected)
  {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
  }

  eyes();
  delay(200);
}