/*
   Bas on Tech
   This course is part of the courses on https://arduino-tutorials.net
   (c) Copyright 2020 - Bas van Dijk / Bas on Tech
   This code and course is copyrighted. It is not allowed to use these courses commercially
   without explicit written approval
   YouTube:    https://www.youtube.com/c/BasOnTech
   Facebook:   https://www.facebook.com/BasOnTechChannel
   Instagram:  https://www.instagram.com/BasOnTech
   Twitter:    https://twitter.com/BasOnTech
   
*/
 
 const int dry = 595; // value for dry sensor
 const int wet = 239; // value for wet sensor

void setup() {
   Serial.begin(9600);

}

void loop() {
  //get values from sensor
 int sensorVal = analogRead(A0);
 //convert to percentage
 int percentageHumididy = map(sensorVal, wet, dry, 100, 0); 
 
 if (percentageHumididy >= 100) {
   Serial.print("wet ");
 } else {
  Serial.print("dry ");
 }

 Serial.print(percentageHumididy);
 Serial.println("%");

 delay(100);

}
