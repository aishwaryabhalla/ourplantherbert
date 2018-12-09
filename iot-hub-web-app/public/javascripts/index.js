var sunlight = 0;

function setsun() {
    sunlight = document.getElementById('sunVal').value;
}

$(document).ready(function () {
  var timeData = [],
    temperatureData = [],
    humidityData = [];
  var data = {
    labels: timeData,
    datasets: [
      {
        fill: false,
        label: 'Temperature',
        yAxisID: 'Temperature',
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        data: temperatureData
      },
      {
        fill: false,
        label: 'Humidity',
        yAxisID: 'Humidity',
        borderColor: "rgba(24, 120, 240, 1)",
        pointBoarderColor: "rgba(24, 120, 240, 1)",
        backgroundColor: "rgba(24, 120, 240, 0.4)",
        pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
        pointHoverBorderColor: "rgba(24, 120, 240, 1)",
        data: humidityData
      }
    ]
  }

  var basicOption = {
    title: {
      display: true,
      text: 'Temperature & Humidity Real-Time Data',
      fontSize: 20
    },
    scales: {
      yAxes: [{
        id: 'Temperature',
        type: 'linear',
        scaleLabel: {
          labelString: 'Temperature(C)',
          display: true
        },
        position: 'left',
      }, {
          id: 'Humidity',
          type: 'linear',
          scaleLabel: {
            labelString: 'Humidity(%)',
            display: true
          },
          position: 'right'
        }]
    }
  }

  //Get the context of the canvas element we want to select
  var ctx = document.getElementById("myChart").getContext("2d");
  var optionsNoAnimation = { animation: false }
  var myLineChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: basicOption
  });

  var soilData = [];
  var ws = new WebSocket('wss://' + location.host);
  ws.onopen = function () {
    console.log('Successfully connect WebSocket');
  }
  ws.onmessage = function (message) {
    console.log('receive message' + message.data);
    try {
      var obj = JSON.parse(message.data);
      if(!obj.time || !obj.temperature) {
        return;
      }
      timeData.push(obj.time);
      temperatureData.push(obj.temperature);
      // only keep no more than 50 points in the line chart
      const maxLen = 50;
      var len = timeData.length;
      if (len > maxLen) {
        timeData.shift();
        temperatureData.shift();
      }

      if (obj.humidity) {
        humidityData.push(obj.humidity);
      }
      if (humidityData.length > maxLen) {
        humidityData.shift();
      }

      //
      suntext = "";
      watertext = "";
      temptext = "";
      var d = new Date();
      switch(sunlight) {
        case 0: // direct sunlight
          if (d.getHours() > 6 && d.getHours() < 18) {
            if (obj.uvIndex < 0.5) {
              suntext = "I need more sunlight!";
            } else if (obj.uvIndex > 7) {
              suntext = "I'm going to die in this sunlight!";
            } else {
              suntext = "I'm good in this sun";
            }
          } else {
            suntext = "It's night";
          }

          if (obj.temperature > 33) {
            temptext = "It's getting quite hot outside. Better keep an eye on me!";
          } else if (obj.temperature < 10) {
            temptext = "Do you <em>want</em> me to freeze?!?!?!";
          } else {
            temptext = "I love this weather.";
          }
          break;
      case 1: // no sun
      if (d.getHours() > 6 && d.getHours() < 18) {
        if (obj.uvIndex > 1) {
          suntext = "<em>Why</em> am I getting <em>light</em>???";
        } else {
          suntext = "I love my shade";
        }
      } else {
        suntext = "It's night";
      }

        if (obj.temperature > 33) {
          temptext = "It's getting quite hot in here. Better keep an eye on me!";
        } else if (obj.temperature < 10) {
          temptext = "Do you <em>want</em> me to freeze?!?!?!";
        } else {
          temptext = "I love this weather.";
        }
        break;
      }

      soilData.push(obj.soil);
      const maxSoilLen = 5;
      var soilLen = soilData.length;
      if (soilLen > maxSoilLen) {
        soilData.shift();
      }
      var soilTotal = 0;
      var i;
      for (i=0; i<soilData.length; i++) {
        soilTotal = soilTotal + soilData[i];
      }
      soilTotal = soilTotal/soilData.length;
      if (soilTotal < 1.5) {
        watertext = "I'm hydrated.";
      } else {
        watertext = "Oh my gosh... I need water. I'm gonna die!!!!";
      }

      myLineChart.update();
      document.getElementById("sunmessage").innerHTML = suntext;
      document.getElementById("watermessage").innerHTML = watertext;
      document.getElementById("weathermessage").innerHTML = temptext;
      document.getElementById("mytemp").innerHTML = obj.temperature;
      document.getElementById("myhum").innerHTML = obj.humidity;
      document.getElementById("myuv").innerHTML = obj.uvIndex;
    } catch (err) {
      console.error(err);
    }
  }
});
