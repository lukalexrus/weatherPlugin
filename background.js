
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

var intervalTime = 1000 * 60 * 30 //* 60
var timeoutTime = 1000 * 60

DEBUG_LOG_ENABLED = true

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

function makeCallForTable() {
    httpGet("https://api.openweathermap.org/data/2.5/weather?lat=56.326799&lon=44.006520&units=metric&lang=ru&appid=" + APP_KEY).then(data => {
        if (DEBUG_LOG_ENABLED) {
            console.log(JSON.stringify(data))
        }
        saveData(data)
        handleWeatherIcon(data)
    }).catch(error => {
        setIcon(null, "")

        console.log("ERROR!! " + error)

    });
}

function saveData(data) {
    chrome.storage.local.set({ data: data }).then(() => {
        if (DEBUG_LOG_ENABLED) {
            console.log("Value is set");
        }
    });
}

makeCallForTable()

setInterval(
    () => {
        var a = new Date();
        console.log("Update value time " + a.toISOString());
        makeCallForTable()
    },
    intervalTime,
)