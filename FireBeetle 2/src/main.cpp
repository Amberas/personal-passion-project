#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Arduino.h>
#include <SPI.h>


float p = 3.1415926;

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
BLECharacteristic *touchCharacteristic = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t valueSensorSoil = 0;
uint8_t sensor_pinSoil = 35;

uint32_t valueSensorTouch = 0;
uint8_t sensor_pinTouch = 15;

#define SERVICE_UUID "0d3e9cec-9c0d-42d9-b752-93ca7cdbd31a"
#define CHARACTERISTIC_UUID "a350e8ca-5e8e-11ec-bf63-0242ac130002"
#define CHARACTERISTIC_UUID_TOUCH "a6b802d2-5e8e-11ec-bf63-0242ac130002"

int last = 0;
int lastTouch = 0;

int soilstat = 0;

void setup()
{
  Serial.begin(9600);
  //TOUCH
  pinMode(15, INPUT);


  //BLUETOOTH
  // Create the BLE Device
  BLEDevice::init("ESP32TWO");

  // Create the BLE Server
  pServer = BLEDevice::createServer();

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  touchCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_TOUCH, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);

  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());
  touchCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0); // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();

}

//only send data when there is a change greater than 20
void changedSensor()
{

  Serial.print(analogRead(sensor_pinSoil));

  //get evarage of 100 readings to liminate noise
  for (int i = 0; i < 100; i++)
  {                                        // used to get a hundred readings of the status of touch
    soilstat = soilstat + analogRead(sensor_pinSoil); // adding the hundred readings within the for loop
  }

  soilstat = soilstat / 100; // dividing by hundred to get average
  pCharacteristic->setValue(soilstat);
  pCharacteristic->notify();
  delay(3); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
  
}

//only send data when there is a change
void changedSensorTouch()
{
  int touchstat = 0;

  //get evarage of 100 readings to liminate noise
  for (int i = 0; i < 100; i++)
  {                                        // used to get a hundred readings of the status of touch
    touchstat = touchstat + touchRead(15); // adding the hundred readings within the for loop
  }
  touchstat = touchstat / 100; // dividing by hundred to get average
  touchCharacteristic->setValue(touchstat);
  touchCharacteristic->notify();
  delay(3);
}

void loop()
{
  //soil
  changedSensor();

  //touch
  changedSensorTouch();


}