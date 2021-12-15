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
#define TFT_CS 5
#define TFT_RST 4
#define TFT_DC 2

// For 1.44" and 1.8" TFT with ST7735 use:
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
float p = 3.1415926;

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
BLECharacteristic *touchCharacteristic = NULL;
BLECharacteristic *screenCharacteristic = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t valueSensorSoil = 0;
uint8_t sensor_pinSoil = 35;

uint32_t valueSensorTouch = 0;
uint8_t sensor_pinTouch = 15;

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_UUID_TOUCH "a1bee35a-5ab9-11ec-bf63-0242ac130002"
#define CHARACTERISTIC_UUID_SCREEN "c92ecec0-5c51-11ec-bf63-0242ac130002"

int last = 0;
int lastTouch = 0;

void eyes()
{
  //EYES
  tft.fillCircle(43, 120, 8, ST77XX_WHITE);
  tft.fillCircle(85, 120, 8, ST77XX_WHITE);
  delay(5000);

  tft.fillCircle(43, 120, 8, ST77XX_BLACK);
  tft.fillCircle(85, 120, 8, ST77XX_BLACK);
}

void mouth()
{
  // MOUTH
  tft.fillCircle(64, 80, 32, ST77XX_WHITE);
  tft.fillCircle(64, 110, 42, ST77XX_BLACK);
}

void setup()
{
  Serial.begin(9600);
  //TOUCH
  pinMode(15, INPUT);

  //DISPLAY
  // Use this initializer if using a 1.8" TFT screen:
  tft.initR(INITR_BLACKTAB); // Init ST7735S chip, black tab

  //BLUETOOTH
  // Create the BLE Device
  BLEDevice::init("ESP32");

  // Create the BLE Server
  pServer = BLEDevice::createServer();

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  touchCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_TOUCH, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  screenCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_SCREEN, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_WRITE);

  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());
  touchCharacteristic->addDescriptor(new BLE2902());
  screenCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0); // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();

  //DISPLAY
  tft.fillScreen(ST77XX_BLACK);
  mouth();
}


//only send data when there is a change greater than 20
void changedSensor () {
  int r = analogRead(sensor_pinSoil);
  int tresh = 20;
  int diff = last - r;
  if (abs(diff) >= tresh)
  {
    last = r;
    pCharacteristic->setValue(r);
    pCharacteristic->notify();
    delay(3); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
  }
}

//only send data when there is a change
void changedSensorTouch () {
  int r = touchRead(15);
  if (r != lastTouch)
  {
    lastTouch = r;
    touchCharacteristic->setValue(r);
    touchCharacteristic->notify();
    delay(3); 
  }
}

void loop()
{
  //soil
  changedSensor();

  //touch
  changedSensorTouch();

  //getting data from node
  std::string rxValue = screenCharacteristic->getValue();
  Serial.println(rxValue.length());

      //DISPLAY
      eyes();
  delay(200);
}