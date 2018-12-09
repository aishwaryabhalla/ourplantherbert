#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>

#if SIMULATED_DATA

void initSensor()
{
    // use SIMULATED_DATA, no sensor need to be inited
}

float readTemperature()
{
    return random(20, 30);
}

float readHumidity()
{
    return random(30, 40);
}

float readSoilMoisture()
{
  return random(50,60);
}

float read uvIndex()
{
  return random(50,60);
}
#else
static DHT dht(DHT_PIN, DHT_TYPE);
int val = 0; //value for storing moisture value 
void initSensor()
{
    dht.begin();

    while (!Serial);
    Serial.println("ZOPT220x UV Index Example");
    Wire.pins(5,4);
    Wire.begin();

    if (zopt220xSetup() == false)
    {
      Serial.println("Sensor failed to respond. Check wiring.");
      while (1); //Freeze!
    }
    Serial.println("ZOPT220x online!");

    enableUVBSensing(); //UVB + UV_COMP channels activated
}

float readTemperature()
{
    return dht.readTemperature();
}

float readHumidity()
{
    return dht.readHumidity();
}

float readSoilMoisture()
{
    // this was calculated as instructed from the hookup guide
    // where we tested the sensor in no water, water, wet soil, dry soil,
    // and taken from the results by our discretion as advised.
    int soil_threshold = 120;
    int result = -1;
//    digitalWrite(SOIL_POWER, HIGH);//turn D7 "On"
    delay(10);//wait 10 milliseconds 
    val = analogRead(SOIL_PIN);//Read the SIG value form sensor 
    Serial.print("Soil Moisture = ");
    Serial.println(val);
//    digitalWrite(SOIL_POWER, LOW);//turn D7 "Off"
    if (val > soil_threshold) {
      result = 1;
    } else {
      result = 2;
    }
    return result;//send current moisture value
}

float readUVIndex()
{
  return getUVIndex();
}

#endif

bool readMessage(int messageId, char *payload)
{
    float temperature = readTemperature();
    float humidity = readHumidity();
    float soilMoisture = readSoilMoisture();
    float uvIndex = readUVIndex();
    StaticJsonBuffer<MESSAGE_MAX_LEN> jsonBuffer;
    JsonObject &root = jsonBuffer.createObject();
    root["deviceId"] = DEVICE_ID;
    root["messageId"] = messageId;
    bool temperatureAlert = false;

    // NAN is not the valid json, change it to NULL
    if (std::isnan(temperature))
    {
        root["temperature"] = NULL;
    }
    else
    {
        root["temperature"] = temperature;
        if (temperature > TEMPERATURE_ALERT)
        {
            temperatureAlert = true;
        }
    }

    if (std::isnan(humidity))
    {
        root["humidity"] = NULL;
    }
    else
    {
        root["humidity"] = humidity;
    }

    if (std::isnan(soilMoisture))
    {
        root["soil"] = NULL;
    }
    else
    {
        root["soil"] = soilMoisture;
    }

    if (std::isnan(uvIndex))
    {
        root["uvIndex"] = NULL;
    }
    else
    {
        root["uvIndex"] = uvIndex;
    }
    root.printTo(payload, MESSAGE_MAX_LEN);
    return temperatureAlert;
}

void parseTwinMessage(char *message)
{
    StaticJsonBuffer<MESSAGE_MAX_LEN> jsonBuffer;
    JsonObject &root = jsonBuffer.parseObject(message);
    if (!root.success())
    {
        Serial.printf("Parse %s failed.\r\n", message);
        return;
    }

    if (root["desired"]["interval"].success())
    {
        interval = root["desired"]["interval"];
    }
    else if (root.containsKey("interval"))
    {
        interval = root["interval"];
    }
}
