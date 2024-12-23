
const APP_KEY = "cdd2c46328f74c42eb9d0c6524edd394"

weatherKey = "weather"
iconKey = "icon"
nameKey = "name"
tempKey = "temp"
mainKey = "main"
descriptionKey = "description"
pressureKey = "pressure"
humidityKey = "humidity"
windKey = "wind"
speedKey = "speed"
dtKey = "dt"
listKey = "list"


savedDataKey = "data"

var intervalTime = 1000 * 60 * 60
var timeoutTime = 10 * 1000

DEBUG_LOG_ENABLED = false

let response = ""

function httpGet(url) {
    return fetch(url, {
        signal: AbortSignal.timeout(timeoutTime),
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Access-Control-Allow-Origin": "*",
        },
    }).then(data => {
        if (DEBUG_LOG_ENABLED) {
            console.table(data);
        }

        return data.json();
    }).catch(error => {
        throw error
    });
}

Object.defineProperty(String.prototype, 'capitalize', {
    value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    enumerable: false
});

function timeConverter(UNIX_timestamp, isFull) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    if (min < 10) {
        min = "0" + min
    }
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min;
    if (!isFull) {
        time = hour + ':' + min;
    }
    return time;
}

function isOutdated(UNIX_timestampUpdated) {
    var updated = new Date(UNIX_timestampUpdated * 1000);
    var today = new Date();
    var diffMs = (today - updated);
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    return diffMins >= 15
}

function generateCityNameView(cityName, date) {
    let infoBlock = document.createElement("div")
    infoBlock.classList.add("info-block")

    let matchText = document.createElement("span")
    matchText.classList.add("city-name")
    matchText.appendChild(document.createTextNode(cityName))
    infoBlock.appendChild(matchText)


    if (isOutdated(date)) {
        let outdated = document.createElement("span")
        outdated.classList.add("outdated-name")
        outdated.appendChild(document.createTextNode("Данные устарели"))
        infoBlock.appendChild(outdated)
    }

    let dateText = document.createElement("span")
    dateText.classList.add("date-block")
    dateText.appendChild(document.createTextNode(timeConverter(date, true)))
    infoBlock.appendChild(dateText)

    return infoBlock
}

function handleWeatherIcon(data) {
    let icon = null
    if (data != null && data[weatherKey] != null && data[weatherKey][0] != null) {
        icon = data[weatherKey][0][iconKey].replace("n", "d")
    }

    let temp = ""
    if (data != null && data[mainKey] != null) {
        temp = data[mainKey][tempKey]
    }

    if (icon != null) {
        setIcon(icon, temp)
    }
}

function createForecastingItem(date, temperature, img, description) {
    let topBlock = document.createElement("div")
    topBlock.classList.add("forecast-item")

    let dateBlock = document.createElement("div")
    dateBlock.classList.add("date-block-forecast")
    dateBlock.appendChild(document.createTextNode(timeConverter(date, false)))
    topBlock.appendChild(dateBlock)

    let imageBlock = document.createElement("img")
    imageBlock.id = "weather-icon"
    imageBlock.width = 46;
    imageBlock.title = description.capitalize();
    imageBlock.src = "./assets/" + img + ".png";

    topBlock.appendChild(imageBlock)

    let temperatureBlock = document.createElement("div")
    temperatureBlock.classList.add("temperature-block-forecast")
    temperatureBlock.appendChild(document.createTextNode(Math.round(temperature) + "℃"))
    topBlock.appendChild(temperatureBlock)
    return topBlock
}

function createForecastingElement(data) {
    let listForecasting = data[listKey]

    if (listForecasting == null) {
        return
    }

    let forecastBlock = document.createElement("div")
    forecastBlock.classList.add("forecast-block")

    let forecastBlockWrapper = document.createElement("div")
    forecastBlockWrapper.classList.add("forecast-block-wrapper")

    for (let item of listForecasting) {
        let date = item[dtKey];

        let temp = item[mainKey][tempKey]
        let icon = item[weatherKey][0][iconKey].replace("n", "d")
        let description = item[weatherKey][0][descriptionKey]

        forecastBlockWrapper.appendChild(createForecastingItem(date, temp, icon, description))
    }
    forecastBlock.appendChild(forecastBlockWrapper);
    document.body.appendChild(forecastBlock);
}

function makeLoadingElement() {
    let loadingBlock = document.createElement("div")
    loadingBlock.classList.add("loader")

    document.body.appendChild(loadingBlock);
}

function makeErrorElement() {
    let errorBlock = document.createElement("div")
    errorBlock.classList.add("error")
    errorBlock.appendChild(document.createTextNode("Ошибка загрузки"))
    document.body.appendChild(errorBlock);
}


function makeForecastingCall() {
    httpGet("https://api.openweathermap.org/data/2.5/forecast?lat=56.326799&lon=44.006520&units=metric&lang=ru&appid=" + APP_KEY).then(data => {
        if (DEBUG_LOG_ENABLED) {
            console.log(JSON.stringify(data))
        }
        createForecastingElement(data)
    }).catch(error => {
        console.log("ERROR!! " + error)
    });
}

function clearAll() {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
}

function makeCallForTable() {
    makeLoadingElement()
    httpGet("https://api.openweathermap.org/data/2.5/weather?lat=56.326799&lon=44.006520&units=metric&lang=ru&appid=" + APP_KEY).then(data => {
        if (DEBUG_LOG_ENABLED) {
            console.log(JSON.stringify(data))
        }
        saveData(data)
        clearAll()
        handleWeatherIcon(data)
        createInfoElement(data)
        makeForecastingCall()
    }).catch(error => {
        clearAll()
        makeErrorElement()
        showOldData()
        setIcon(null, "")
        console.log("ERROR!! " + error)
    });
}

function setIcon(name, temperature) {
    if (name != null) {
        chrome.action.setIcon({ path: "./assets/" + name + ".png" })
    }

    let temperatureValue = ""
    if (temperature != "") {
        temperatureValue = Math.round(temperature) + "℃"
    }
    chrome.action.setBadgeText({
        text: temperatureValue,
    })
}

function weatherBlock(temperature, img, description) {
    let topBlock = document.createElement("div")
    topBlock.classList.add("top-block")

    let temperatureBlock = document.createElement("div")
    temperatureBlock.classList.add("temperature-block")
    temperatureBlock.appendChild(document.createTextNode(Math.round(temperature) + "℃"))

    topBlock.appendChild(temperatureBlock)

    let imageBlock = document.createElement("img")
    imageBlock.id = "weather-icon"
    imageBlock.width = 66;
    imageBlock.src = "./assets/" + img + ".png";

    topBlock.appendChild(imageBlock)

    let descriptionBlock = document.createElement("div")
    descriptionBlock.classList.add("temperature-description")
    descriptionBlock.appendChild(document.createTextNode(description.capitalize()))

    topBlock.appendChild(descriptionBlock)

    return topBlock
}


function additionalBlock(wind, humidity, pressure) {
    let topBlock = document.createElement("div")
    topBlock.classList.add("additional-block")

    let windBlock = document.createElement("div")
    windBlock.classList.add("wind-block")
    let imageBlock = document.createElement("img")
    imageBlock.id = "wind-icon"
    imageBlock.width = 25;
    imageBlock.src = "https://cdn-icons-png.flaticon.com/512/135/135005.png";
    windBlock.appendChild(imageBlock)

    windBlock.appendChild(document.createTextNode(wind + "m/s"))

    topBlock.appendChild(windBlock)

    let humidityBlock = document.createElement("div")
    humidityBlock.classList.add("humidity-block")
    let imageBlock2 = document.createElement("img")
    imageBlock2.id = "humidity-icon"
    imageBlock2.width = 25;
    imageBlock2.src = "https://static.thenounproject.com/png/2280622-200.png";
    humidityBlock.appendChild(imageBlock2)

    humidityBlock.appendChild(document.createTextNode(humidity + "%"))

    topBlock.appendChild(humidityBlock)

    let pressureBlock = document.createElement("div")
    pressureBlock.classList.add("pressure-block")
    let imageBlock3 = document.createElement("img")
    imageBlock3.id = "humidity-icon"
    imageBlock3.width = 25;
    imageBlock3.src = "https://cdn-icons-png.flaticon.com/512/2675/2675979.png";
    pressureBlock.appendChild(imageBlock3)

    pressureBlock.appendChild(document.createTextNode(pressure + "mmHg"))

    topBlock.appendChild(pressureBlock)

    return topBlock
}

function createInfoElement(data) {
    let cityName = data[nameKey]
    let date = data[dtKey];
    if (data[mainKey] == null || data[weatherKey] == null) {
        return
    }
    let temp = data[mainKey][tempKey]
    let icon = data[weatherKey][0][iconKey].replace("n", "d")
    let description = data[weatherKey][0][descriptionKey]

    let wind = data[windKey][speedKey]
    let humidity = data[mainKey][humidityKey]
    let pressure = data[mainKey][pressureKey]


    let mainBlock = document.createElement("div")
    mainBlock.classList.add("main-block")


    mainBlock.appendChild(generateCityNameView(cityName, date))
    mainBlock.appendChild(weatherBlock(temp, icon, description))
    mainBlock.appendChild(additionalBlock(wind, humidity, pressure))
    let delimitter = document.createElement("div")
    delimitter.classList.add("delimitter-block")
    mainBlock.appendChild(delimitter)

    document.body.appendChild(mainBlock);
}


function saveData(data) {
    chrome.storage.local.set({ data: data }).then(() => {
        if (DEBUG_LOG_ENABLED) {
            console.log("Value is set");
        }
    });
}

function showOldData() {
    chrome.storage.local.get(["data"]).then((result) => {
        let savedData = result[savedDataKey]
        handleWeatherIcon(savedData)
        createInfoElement(savedData)
    });
}

showOldData()

makeCallForTable()

response = { "coord": { "lon": 44.0065, "lat": 56.3268 }, "weather": [{ "id": 803, "main": "Clouds", "description": "broken clouds", "icon": "04d" }], "base": "stations", "main": { "temp": 276.71, "feels_like": 272.69, "temp_min": 276.71, "temp_max": 276.71, "pressure": 1000, "humidity": 87, "sea_level": 1000, "grnd_level": 989 }, "visibility": 10000, "wind": { "speed": 5, "deg": 270 }, "clouds": { "all": 75 }, "dt": 1730367960, "sys": { "type": 1, "id": 9037, "country": "RU", "sunrise": 1730347811, "sunset": 1730381090 }, "timezone": 10800, "id": 520555, "name": "Nizhny Novgorod", "cod": 200 }
forecasting = {
    "cod": "200",
    "message": 0,
    "cnt": 40,
    "list": [
        {
            "dt": 1730386800,
            "main": {
                "temp": 275.84,
                "feels_like": 271.11,
                "temp_min": 275.84,
                "temp_max": 276.1,
                "pressure": 1001,
                "sea_level": 1001,
                "grnd_level": 992,
                "humidity": 81,
                "temp_kf": -0.26
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 80
            },
            "wind": {
                "speed": 6,
                "deg": 277,
                "gust": 10.49
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-10-31 15:00:00"
        },
        {
            "dt": 1730397600,
            "main": {
                "temp": 275.26,
                "feels_like": 270.31,
                "temp_min": 275.03,
                "temp_max": 275.26,
                "pressure": 1002,
                "sea_level": 1002,
                "grnd_level": 992,
                "humidity": 77,
                "temp_kf": 0.23
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 88
            },
            "wind": {
                "speed": 6.15,
                "deg": 280,
                "gust": 10.89
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-10-31 18:00:00"
        },
        {
            "dt": 1730408400,
            "main": {
                "temp": 273.79,
                "feels_like": 268.77,
                "temp_min": 273.79,
                "temp_max": 273.79,
                "pressure": 1004,
                "sea_level": 1004,
                "grnd_level": 993,
                "humidity": 71,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 802,
                    "main": "Clouds",
                    "description": "scattered clouds",
                    "icon": "03n"
                }
            ],
            "clouds": {
                "all": 49
            },
            "wind": {
                "speed": 5.49,
                "deg": 276,
                "gust": 10.06
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-10-31 21:00:00"
        },
        {
            "dt": 1730419200,
            "main": {
                "temp": 272.61,
                "feels_like": 267.86,
                "temp_min": 272.61,
                "temp_max": 272.61,
                "pressure": 1004,
                "sea_level": 1004,
                "grnd_level": 993,
                "humidity": 76,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 802,
                    "main": "Clouds",
                    "description": "scattered clouds",
                    "icon": "03n"
                }
            ],
            "clouds": {
                "all": 31
            },
            "wind": {
                "speed": 4.51,
                "deg": 262,
                "gust": 9.67
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-01 00:00:00"
        },
        {
            "dt": 1730430000,
            "main": {
                "temp": 272.06,
                "feels_like": 267.7,
                "temp_min": 272.06,
                "temp_max": 272.06,
                "pressure": 1003,
                "sea_level": 1003,
                "grnd_level": 992,
                "humidity": 81,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 800,
                    "main": "Clear",
                    "description": "clear sky",
                    "icon": "01n"
                }
            ],
            "clouds": {
                "all": 9
            },
            "wind": {
                "speed": 3.77,
                "deg": 233,
                "gust": 8.73
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-01 03:00:00"
        },
        {
            "dt": 1730440800,
            "main": {
                "temp": 273.28,
                "feels_like": 268.77,
                "temp_min": 273.28,
                "temp_max": 273.28,
                "pressure": 1002,
                "sea_level": 1002,
                "grnd_level": 991,
                "humidity": 93,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13d"
                }
            ],
            "clouds": {
                "all": 55
            },
            "wind": {
                "speed": 4.38,
                "deg": 214,
                "gust": 9.34
            },
            "visibility": 358,
            "pop": 0.47,
            "snow": {
                "3h": 0.53
            },
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-01 06:00:00"
        },
        {
            "dt": 1730451600,
            "main": {
                "temp": 274.86,
                "feels_like": 270.94,
                "temp_min": 274.86,
                "temp_max": 274.86,
                "pressure": 998,
                "sea_level": 998,
                "grnd_level": 987,
                "humidity": 96,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 4.04,
                "deg": 190,
                "gust": 9.42
            },
            "visibility": 95,
            "pop": 1,
            "snow": {
                "3h": 1.03
            },
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-01 09:00:00"
        },
        {
            "dt": 1730462400,
            "main": {
                "temp": 274.33,
                "feels_like": 269.68,
                "temp_min": 274.33,
                "temp_max": 274.33,
                "pressure": 993,
                "sea_level": 993,
                "grnd_level": 982,
                "humidity": 97,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 601,
                    "main": "Snow",
                    "description": "snow",
                    "icon": "13d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 5.06,
                "deg": 168,
                "gust": 11.8
            },
            "visibility": 24,
            "pop": 1,
            "snow": {
                "3h": 2.24
            },
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-01 12:00:00"
        },
        {
            "dt": 1730473200,
            "main": {
                "temp": 274.45,
                "feels_like": 269.66,
                "temp_min": 274.45,
                "temp_max": 274.45,
                "pressure": 987,
                "sea_level": 987,
                "grnd_level": 977,
                "humidity": 98,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 601,
                    "main": "Snow",
                    "description": "snow",
                    "icon": "13n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 5.37,
                "deg": 178,
                "gust": 13.13
            },
            "visibility": 27,
            "pop": 1,
            "snow": {
                "3h": 3.14
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-01 15:00:00"
        },
        {
            "dt": 1730484000,
            "main": {
                "temp": 276.55,
                "feels_like": 272.01,
                "temp_min": 276.55,
                "temp_max": 276.55,
                "pressure": 981,
                "sea_level": 981,
                "grnd_level": 971,
                "humidity": 98,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 500,
                    "main": "Rain",
                    "description": "light rain",
                    "icon": "10n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 6.02,
                "deg": 184,
                "gust": 13.54
            },
            "visibility": 10000,
            "pop": 1,
            "rain": {
                "3h": 0.77
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-01 18:00:00"
        },
        {
            "dt": 1730494800,
            "main": {
                "temp": 278.82,
                "feels_like": 274.93,
                "temp_min": 278.82,
                "temp_max": 278.82,
                "pressure": 976,
                "sea_level": 976,
                "grnd_level": 965,
                "humidity": 97,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 500,
                    "main": "Rain",
                    "description": "light rain",
                    "icon": "10n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 5.91,
                "deg": 204,
                "gust": 12.75
            },
            "visibility": 10000,
            "pop": 1,
            "rain": {
                "3h": 1.17
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-01 21:00:00"
        },
        {
            "dt": 1730505600,
            "main": {
                "temp": 279.34,
                "feels_like": 274.58,
                "temp_min": 279.34,
                "temp_max": 279.34,
                "pressure": 975,
                "sea_level": 975,
                "grnd_level": 965,
                "humidity": 84,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 500,
                    "main": "Rain",
                    "description": "light rain",
                    "icon": "10n"
                }
            ],
            "clouds": {
                "all": 99
            },
            "wind": {
                "speed": 9.01,
                "deg": 263,
                "gust": 14.45
            },
            "visibility": 10000,
            "pop": 1,
            "rain": {
                "3h": 0.32
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-02 00:00:00"
        },
        {
            "dt": 1730516400,
            "main": {
                "temp": 274.83,
                "feels_like": 269.03,
                "temp_min": 274.83,
                "temp_max": 274.83,
                "pressure": 978,
                "sea_level": 978,
                "grnd_level": 968,
                "humidity": 94,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 7.93,
                "deg": 285,
                "gust": 13.26
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-02 03:00:00"
        },
        {
            "dt": 1730527200,
            "main": {
                "temp": 274.11,
                "feels_like": 268.25,
                "temp_min": 274.11,
                "temp_max": 274.11,
                "pressure": 982,
                "sea_level": 982,
                "grnd_level": 971,
                "humidity": 74,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 7.54,
                "deg": 298,
                "gust": 12.07
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-02 06:00:00"
        },
        {
            "dt": 1730538000,
            "main": {
                "temp": 273.82,
                "feels_like": 267.98,
                "temp_min": 273.82,
                "temp_max": 273.82,
                "pressure": 985,
                "sea_level": 985,
                "grnd_level": 974,
                "humidity": 72,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 7.29,
                "deg": 287,
                "gust": 11.83
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-02 09:00:00"
        },
        {
            "dt": 1730548800,
            "main": {
                "temp": 272.81,
                "feels_like": 266.52,
                "temp_min": 272.81,
                "temp_max": 272.81,
                "pressure": 988,
                "sea_level": 988,
                "grnd_level": 978,
                "humidity": 88,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 7.66,
                "deg": 320,
                "gust": 12.25
            },
            "visibility": 849,
            "pop": 0.87,
            "snow": {
                "3h": 0.65
            },
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-02 12:00:00"
        },
        {
            "dt": 1730559600,
            "main": {
                "temp": 272.34,
                "feels_like": 265.8,
                "temp_min": 272.34,
                "temp_max": 272.34,
                "pressure": 993,
                "sea_level": 993,
                "grnd_level": 982,
                "humidity": 70,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 7.92,
                "deg": 313,
                "gust": 13.66
            },
            "visibility": 10000,
            "pop": 0.69,
            "snow": {
                "3h": 0.38
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-02 15:00:00"
        },
        {
            "dt": 1730570400,
            "main": {
                "temp": 271.5,
                "feels_like": 264.89,
                "temp_min": 271.5,
                "temp_max": 271.5,
                "pressure": 997,
                "sea_level": 997,
                "grnd_level": 986,
                "humidity": 73,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 97
            },
            "wind": {
                "speed": 7.5,
                "deg": 301,
                "gust": 12.52
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-02 18:00:00"
        },
        {
            "dt": 1730581200,
            "main": {
                "temp": 270.72,
                "feels_like": 264.51,
                "temp_min": 270.72,
                "temp_max": 270.72,
                "pressure": 999,
                "sea_level": 999,
                "grnd_level": 988,
                "humidity": 81,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 802,
                    "main": "Clouds",
                    "description": "scattered clouds",
                    "icon": "03n"
                }
            ],
            "clouds": {
                "all": 34
            },
            "wind": {
                "speed": 6.2,
                "deg": 281,
                "gust": 12.7
            },
            "visibility": 9373,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-02 21:00:00"
        },
        {
            "dt": 1730592000,
            "main": {
                "temp": 271.63,
                "feels_like": 265.11,
                "temp_min": 271.63,
                "temp_max": 271.63,
                "pressure": 1001,
                "sea_level": 1001,
                "grnd_level": 990,
                "humidity": 82,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13n"
                }
            ],
            "clouds": {
                "all": 67
            },
            "wind": {
                "speed": 7.38,
                "deg": 293,
                "gust": 12.45
            },
            "visibility": 10000,
            "pop": 0.2,
            "snow": {
                "3h": 0.35
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-03 00:00:00"
        },
        {
            "dt": 1730602800,
            "main": {
                "temp": 271.34,
                "feels_like": 264.96,
                "temp_min": 271.34,
                "temp_max": 271.34,
                "pressure": 1002,
                "sea_level": 1002,
                "grnd_level": 991,
                "humidity": 72,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 97
            },
            "wind": {
                "speed": 6.9,
                "deg": 295,
                "gust": 11.84
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-03 03:00:00"
        },
        {
            "dt": 1730613600,
            "main": {
                "temp": 271.53,
                "feels_like": 265.37,
                "temp_min": 271.53,
                "temp_max": 271.53,
                "pressure": 1004,
                "sea_level": 1004,
                "grnd_level": 993,
                "humidity": 75,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 98
            },
            "wind": {
                "speed": 6.54,
                "deg": 286,
                "gust": 11.37
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-03 06:00:00"
        },
        {
            "dt": 1730624400,
            "main": {
                "temp": 272.76,
                "feels_like": 267.16,
                "temp_min": 272.76,
                "temp_max": 272.76,
                "pressure": 1005,
                "sea_level": 1005,
                "grnd_level": 994,
                "humidity": 80,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 6.09,
                "deg": 282,
                "gust": 9.65
            },
            "visibility": 9442,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-03 09:00:00"
        },
        {
            "dt": 1730635200,
            "main": {
                "temp": 272.71,
                "feels_like": 267.12,
                "temp_min": 272.71,
                "temp_max": 272.71,
                "pressure": 1006,
                "sea_level": 1006,
                "grnd_level": 995,
                "humidity": 84,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 6.04,
                "deg": 278,
                "gust": 10.61
            },
            "visibility": 10000,
            "pop": 0.2,
            "snow": {
                "3h": 0.26
            },
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-03 12:00:00"
        },
        {
            "dt": 1730646000,
            "main": {
                "temp": 272.52,
                "feels_like": 266.82,
                "temp_min": 272.52,
                "temp_max": 272.52,
                "pressure": 1007,
                "sea_level": 1007,
                "grnd_level": 996,
                "humidity": 74,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 600,
                    "main": "Snow",
                    "description": "light snow",
                    "icon": "13n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 6.15,
                "deg": 288,
                "gust": 10.81
            },
            "visibility": 10000,
            "pop": 0.86,
            "snow": {
                "3h": 0.43
            },
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-03 15:00:00"
        },
        {
            "dt": 1730656800,
            "main": {
                "temp": 271.28,
                "feels_like": 266.04,
                "temp_min": 271.28,
                "temp_max": 271.28,
                "pressure": 1007,
                "sea_level": 1007,
                "grnd_level": 996,
                "humidity": 84,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 94
            },
            "wind": {
                "speed": 4.77,
                "deg": 268,
                "gust": 9.63
            },
            "visibility": 10000,
            "pop": 0.19,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-03 18:00:00"
        },
        {
            "dt": 1730667600,
            "main": {
                "temp": 270.7,
                "feels_like": 266.26,
                "temp_min": 270.7,
                "temp_max": 270.7,
                "pressure": 1006,
                "sea_level": 1006,
                "grnd_level": 995,
                "humidity": 88,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 82
            },
            "wind": {
                "speed": 3.49,
                "deg": 261,
                "gust": 7.95
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-03 21:00:00"
        },
        {
            "dt": 1730678400,
            "main": {
                "temp": 270.09,
                "feels_like": 266.55,
                "temp_min": 270.09,
                "temp_max": 270.09,
                "pressure": 1006,
                "sea_level": 1006,
                "grnd_level": 995,
                "humidity": 90,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 64
            },
            "wind": {
                "speed": 2.46,
                "deg": 251,
                "gust": 5.96
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-04 00:00:00"
        },
        {
            "dt": 1730689200,
            "main": {
                "temp": 270.02,
                "feels_like": 270.02,
                "temp_min": 270.02,
                "temp_max": 270.02,
                "pressure": 1005,
                "sea_level": 1005,
                "grnd_level": 994,
                "humidity": 90,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 1.22,
                "deg": 219,
                "gust": 1.8
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-04 03:00:00"
        },
        {
            "dt": 1730700000,
            "main": {
                "temp": 270.94,
                "feels_like": 270.94,
                "temp_min": 270.94,
                "temp_max": 270.94,
                "pressure": 1006,
                "sea_level": 1006,
                "grnd_level": 995,
                "humidity": 87,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 0.49,
                "deg": 133,
                "gust": 0.5
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-04 06:00:00"
        },
        {
            "dt": 1730710800,
            "main": {
                "temp": 272.39,
                "feels_like": 270.32,
                "temp_min": 272.39,
                "temp_max": 272.39,
                "pressure": 1006,
                "sea_level": 1006,
                "grnd_level": 995,
                "humidity": 77,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 1.63,
                "deg": 43,
                "gust": 1.94
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-04 09:00:00"
        },
        {
            "dt": 1730721600,
            "main": {
                "temp": 272.22,
                "feels_like": 269.77,
                "temp_min": 272.22,
                "temp_max": 272.22,
                "pressure": 1007,
                "sea_level": 1007,
                "grnd_level": 996,
                "humidity": 75,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 1.88,
                "deg": 17,
                "gust": 2.91
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-04 12:00:00"
        },
        {
            "dt": 1730732400,
            "main": {
                "temp": 271.04,
                "feels_like": 267.87,
                "temp_min": 271.04,
                "temp_max": 271.04,
                "pressure": 1008,
                "sea_level": 1008,
                "grnd_level": 997,
                "humidity": 81,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 2.29,
                "deg": 1,
                "gust": 4.38
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-04 15:00:00"
        },
        {
            "dt": 1730743200,
            "main": {
                "temp": 270.42,
                "feels_like": 266.66,
                "temp_min": 270.42,
                "temp_max": 270.42,
                "pressure": 1010,
                "sea_level": 1010,
                "grnd_level": 999,
                "humidity": 83,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 2.71,
                "deg": 12,
                "gust": 5.21
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-04 18:00:00"
        },
        {
            "dt": 1730754000,
            "main": {
                "temp": 269.97,
                "feels_like": 266.16,
                "temp_min": 269.97,
                "temp_max": 269.97,
                "pressure": 1011,
                "sea_level": 1011,
                "grnd_level": 999,
                "humidity": 90,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 2.68,
                "deg": 10,
                "gust": 5.29
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-04 21:00:00"
        },
        {
            "dt": 1730764800,
            "main": {
                "temp": 271.16,
                "feels_like": 266.92,
                "temp_min": 271.16,
                "temp_max": 271.16,
                "pressure": 1011,
                "sea_level": 1011,
                "grnd_level": 1000,
                "humidity": 79,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 3.38,
                "deg": 11,
                "gust": 6.05
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-05 00:00:00"
        },
        {
            "dt": 1730775600,
            "main": {
                "temp": 270.08,
                "feels_like": 265.81,
                "temp_min": 270.08,
                "temp_max": 270.08,
                "pressure": 1012,
                "sea_level": 1012,
                "grnd_level": 1001,
                "humidity": 89,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 100
            },
            "wind": {
                "speed": 3.16,
                "deg": 345,
                "gust": 6.65
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2024-11-05 03:00:00"
        },
        {
            "dt": 1730786400,
            "main": {
                "temp": 270.03,
                "feels_like": 265.22,
                "temp_min": 270.03,
                "temp_max": 270.03,
                "pressure": 1014,
                "sea_level": 1014,
                "grnd_level": 1003,
                "humidity": 86,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 98
            },
            "wind": {
                "speed": 3.76,
                "deg": 346,
                "gust": 8.06
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-05 06:00:00"
        },
        {
            "dt": 1730797200,
            "main": {
                "temp": 271.48,
                "feels_like": 266.29,
                "temp_min": 271.48,
                "temp_max": 271.48,
                "pressure": 1015,
                "sea_level": 1015,
                "grnd_level": 1004,
                "humidity": 74,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 79
            },
            "wind": {
                "speed": 4.76,
                "deg": 346,
                "gust": 7.59
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-05 09:00:00"
        },
        {
            "dt": 1730808000,
            "main": {
                "temp": 271.32,
                "feels_like": 266.6,
                "temp_min": 271.32,
                "temp_max": 271.32,
                "pressure": 1015,
                "sea_level": 1015,
                "grnd_level": 1004,
                "humidity": 76,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 82
            },
            "wind": {
                "speed": 4.02,
                "deg": 342,
                "gust": 7.79
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2024-11-05 12:00:00"
        }
    ],
    "city": {
        "id": 520555,
        "name": "Nizhny Novgorod",
        "coord": {
            "lat": 56.3268,
            "lon": 44.0065
        },
        "country": "RU",
        "population": 1284164,
        "timezone": 10800,
        "sunrise": 1730347811,
        "sunset": 1730381090
    }
}