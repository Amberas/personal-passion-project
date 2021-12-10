/*
  Arduino LSM9DS1 - Accelerometer Application

  This example reads the acceleration values as relative direction and degrees,
  from the LSM9DS1 sensor and prints them to the Serial Monitor or Serial Plotter.

  The circuit:
  - Arduino Nano 33 BLE Sense

  Created by Riccardo Rizzo

  Modified by Jose García
  27 Nov 2020

  This example code is in the public domain.
*/

#include <Arduino_LSM9DS1.h>
#include <ArduinoBLE.h>
#include <Arduino.h>

float x,
    y, z;
int degreesX = 0;
int degreesY = 0;

// create service (random)
BLEService service("12345678-1234-5678-1234-56789ABCDEF0");

//create characteristic and allow remote device to get notifications
BLEIntCharacteristic upCharacteristic("12345678-1234-5678-1234-56789ABCDEF1", BLERead | BLENotify);
BLEIntCharacteristic downCharacteristic("12345678-1234-5678-1234-56789ABCDEF2", BLERead | BLENotify);
BLEIntCharacteristic leftCharacteristic("12345678-1234-5678-1234-56789ABCDEF3", BLERead | BLENotify);
BLEIntCharacteristic rightCharacteristic("12345678-1234-5678-1234-56789ABCDEF4", BLERead | BLENotify);

void setup()
{
  Serial.begin(9600);
  while (!Serial)
    ;
  Serial.println("Started");

  if (!IMU.begin())
  {
    Serial.println("Failed to initialize IMU!");
    while (1)
      ;
  }

  // begin initialization
  if (!BLE.begin())
  {
    Serial.println("starting BLE failed!");

    while (1)
      ;
  }

  // set the local name peripheral advertises
  BLE.setLocalName("ArduinoNano");
  // set the UUID for the service this peripheral advertises:
  BLE.setAdvertisedService(service);

  // add the characteristics to the service
  service.addCharacteristic(upCharacteristic);
  service.addCharacteristic(downCharacteristic);
  service.addCharacteristic(leftCharacteristic);
  service.addCharacteristic(rightCharacteristic);

  // add the service
  BLE.addService(service);

  upCharacteristic.writeValue(0);
  downCharacteristic.writeValue(0);
  leftCharacteristic.writeValue(0);
  rightCharacteristic.writeValue(0);

  // start advertising
  BLE.advertise();
}

void loop()
{

  // poll for BLE events
  BLE.poll();

  if (IMU.accelerationAvailable())
  {
    IMU.readAcceleration(x, y, z);
  }

  if (x > 0.1)
  {
    x = 100 * x;
    degreesX = map(x, 0, 97, 0, 90);
    //send new data as characteristic
    upCharacteristic.writeValue(degreesX);
    Serial.print("Tilting up ");
    Serial.print(degreesX);
    Serial.println("  degrees");
  }
  if (x < -0.1)
  {
    x = 100 * x;
    degreesX = map(x, 0, -100, 0, 90);
    //send new data as characteristic
    downCharacteristic.writeValue(degreesX);
    Serial.print("Tilting down ");
    Serial.print(degreesX);
    Serial.println("  degrees");
  }
  if (y > 0.1)
  {
    y = 100 * y;
    degreesY = map(y, 0, 97, 0, 90);
    //send new data as characteristic
    leftCharacteristic.writeValue(degreesY);
    Serial.print("Tilting left ");
    Serial.print(degreesY);
    Serial.println("  degrees");
  }
  if (y < -0.1)
  {
    y = 100 * y;
    degreesY = map(y, 0, -100, 0, 90);
    //send new data as characteristic
    rightCharacteristic.writeValue(degreesY);
    Serial.print("Tilting right ");
    Serial.print(degreesY);
    Serial.println("  degrees");
  }

  delay(500);
}