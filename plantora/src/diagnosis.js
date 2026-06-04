var THINGSPEAK_URL =
  "https://api.thingspeak.com/channels/3395896/feeds.json?results=1";

var PLANTS = {
  money:    { name: "Money Plant",  icon: "🪴", tempMin: 24, tempMax: 28, humMin: 55, humMax: 70 },
  snake:    { name: "Snake Plant",  icon: "🌿", tempMin: 22, tempMax: 30, humMin: 40, humMax: 65 },
  peace:    { name: "Peace Lily",   icon: "🌸", tempMin: 20, tempMax: 26, humMin: 60, humMax: 80 },
  aloe:     { name: "Aloe Vera",    icon: "🌵", tempMin: 24, tempMax: 32, humMin: 25, humMax: 45 },
  spider:   { name: "Spider Plant", icon: "🌱", tempMin: 18, tempMax: 28, humMin: 40, humMax: 65 },
  rose:     { name: "Rose",         icon: "🌹", tempMin: 20, tempMax: 26, humMin: 60, humMax: 75 },
  hibiscus: { name: "Hibiscus",     icon: "🌺", tempMin: 22, tempMax: 30, humMin: 50, humMax: 70 },
  jasmine:  { name: "Jasmine",      icon: "🌼", tempMin: 20, tempMax: 28, humMin: 55, humMax: 75 },
  tulsi:    { name: "Tulsi",        icon: "🍃", tempMin: 18, tempMax: 30, humMin: 40, humMax: 65 },
  sunflower:{ name: "Sunflower",    icon: "🌻", tempMin: 20, tempMax: 35, humMin: 30, humMax: 60 }
};

function getSoilStatus(raw) {

  if (raw <= 2500)
    return { label: "Good", cls: "good", deduct: 0 };

  if (raw <= 4000)
    return { label: "Medium", cls: "warning", deduct: 20 };

  return { label: "Dry", cls: "bad", deduct: 40 };
}

function getLightStatus(raw) {

  if (raw <= 1500)
    return { label: "Bright", cls: "good", deduct: 0 };

  if (raw <= 3000)
    return { label: "Moderate", cls: "warning", deduct: 10 };

  return { label: "Low Light", cls: "bad", deduct: 20 };
}

function getParamStatus(value, min, max) {

  if (value >= min && value <= max)
    return { label: "Good", cls: "good", deduct: 0 };

  var diff = value < min ? min - value : value - max;

  if (diff <= 5)
    return { label: "Warning", cls: "warning", deduct: 15 };

  return { label: "Critical", cls: "bad", deduct: 30 };
}

function calcHealthScore(tempStatus, humStatus, soilStatus, lightStatus) {

  var score =
    100 -
    tempStatus.deduct -
    humStatus.deduct -
    soilStatus.deduct -
    lightStatus.deduct;

  return Math.max(0, Math.min(100, score));
}

function getOverallStatus(score) {

  if (score >= 70)
    return { label: "Healthy", cls: "healthy", emoji: "🟢" };

  if (score >= 40)
    return { label: "Moderate", cls: "moderate", emoji: "🟡" };

  return { label: "Critical", cls: "critical", emoji: "🔴" };
}

function buildTips(
  plant,
  temp,
  hum,
  tempStatus,
  humStatus,
  soilStatus,
  lightStatus,
  ldr
) {

  var tips = [];

  if (tempStatus.cls !== "good") {

    if (temp < plant.tempMin)
      tips.push("Temperature is too low. Move plant to warmer area.");

    else
      tips.push("Temperature is too high. Move plant to cooler area.");
  }

  if (humStatus.cls !== "good") {

    if (hum < plant.humMin)
      tips.push("Humidity is low. Try misting the plant.");

    else
      tips.push("Humidity is high. Improve air circulation.");
  }

  if (soilStatus.cls === "warning")
    tips.push("Soil moisture is medium. Water plant soon.");

  if (soilStatus.cls === "bad")
    tips.push("Soil is very dry. Water immediately.");

  if (lightStatus.cls === "warning")
    tips.push("Plant is receiving moderate light.");

  if (lightStatus.cls === "bad")
    tips.push("Plant is not getting enough sunlight.");

  if (tips.length === 0)
    tips.push("All conditions are optimal. Plant is healthy.");

  return tips;
}

function el(id) {
  return document.getElementById(id);
}

function show(id) {
  var e = el(id);
  if (e) e.classList.remove("hidden");
}

function hide(id) {
  var e = el(id);
  if (e) e.classList.add("hidden");
}

function setText(id, txt) {
  var e = el(id);
  if (e) e.textContent = txt;
}

function setSensorCard(
  cardId,
  valId,
  rangeText,
  rangeId,
  badgeId,
  value,
  status
) {

  var card = el(cardId);

  if (!card) return;

  card.className = "sensor-card " + status.cls;

  setText(valId, value);

  setText(rangeId, rangeText);

  var badge = el(badgeId);

  if (badge) {

    badge.textContent = status.label;

    badge.className = "sensor-badge " + status.cls;
  }
}

function runDiagnosis() {

  var params = new URLSearchParams(window.location.search);

  var plantId = params.get("plant");

  var plant = PLANTS[plantId];

  if (!plant) {

    show("error-section");

    setText(
      "error-text",
      "Unknown plant selected."
    );

    return;
  }

  var btn = el("scan-btn");

  var scanText = el("scan-text");

  btn.disabled = true;

  scanText.innerHTML = "Scanning...";

  hide("error-section");

  fetch(THINGSPEAK_URL)

    .then(function(res) {

      if (!res.ok)
        throw new Error("Error fetching sensor data");

      return res.json();
    })

    .then(function(json) {

      var feeds = json.feeds;

      if (!feeds || feeds.length === 0)
        throw new Error("No sensor data available");

      var latest = feeds[feeds.length - 1];

      var temp = parseFloat(latest.field1);

      var hum = parseFloat(latest.field2);

      var soil = parseFloat(latest.field3);

      var ldr = parseFloat(latest.field4);

      if (
        isNaN(temp) ||
        isNaN(hum) ||
        isNaN(soil)
      ) {

        throw new Error("Incomplete sensor data");
      }

      var tempStatus = getParamStatus(
        temp,
        plant.tempMin,
        plant.tempMax
      );

      var humStatus = getParamStatus(
        hum,
        plant.humMin,
        plant.humMax
      );

      var soilStatus = getSoilStatus(soil);

      var lightStatus = getLightStatus(ldr);

      var score = calcHealthScore(
        tempStatus,
        humStatus,
        soilStatus,
        lightStatus
      );

      var overall = getOverallStatus(score);

      var tips = buildTips(
        plant,
        temp,
        hum,
        tempStatus,
        humStatus,
        soilStatus,
        lightStatus,
        ldr
      );

      var banner = el("status-banner");

      banner.className =
        "status-banner " + overall.cls;

      setText(
        "status-label",
        overall.emoji + " " + overall.label
      );

      setText(
        "status-msg",
        "Health score: " + score + "/100"
      );

      show("status-banner");

      setText(
        "health-score-num",
        score + "/100"
      );

      var fill = el("health-bar-fill");

      if (fill)
        fill.style.width = score + "%";

      show("health-section");

      setSensorCard(
        "card-temp",
        "temp-value",
        "Ideal: " +
          plant.tempMin +
          "-" +
          plant.tempMax +
          "°C",
        "temp-range",
        "temp-status",
        temp.toFixed(1) + "°C",
        tempStatus
      );

      setSensorCard(
        "card-hum",
        "hum-value",
        "Ideal: " +
          plant.humMin +
          "-" +
          plant.humMax +
          "%",
        "hum-range",
        "hum-status",
        hum.toFixed(1) + "%",
        humStatus
      );

      setSensorCard(
        "card-soil",
        "soil-value",
        "Soil moisture level",
        "soil-range",
        "soil-status",
        Math.round(soil),
        soilStatus
      );

      setSensorCard(
        "card-light",
        "light-value",
        "Sunlight intensity",
        "light-range",
        "light-status",
        Math.round(ldr),
        lightStatus
      );

      show("sensor-grid");

      var list = el("tips-list");

      if (list) {

        list.innerHTML = tips
          .map(function(t) {
            return "<li>" + t + "</li>";
          })
          .join("");
      }

      show("tips-section");

      var ts = latest.created_at
        ? new Date(latest.created_at).toLocaleString()
        : new Date().toLocaleString();

      setText(
        "last-updated-text",
        "Last updated: " + ts
      );

      show("last-updated");
    })

    .catch(function(err) {

      show("error-section");

      setText(
        "error-text",
        err.message || "Unable to fetch data"
      );
    })

    .finally(function() {

      btn.disabled = false;

      scanText.textContent = "Scan Plant";
    });
}

function initDashboard() {

  var params = new URLSearchParams(window.location.search);

  var plantId = params.get("plant");

  var plant = PLANTS[plantId];

  if (!plant) {

    setText("plant-name", "Unknown Plant");

    setText("plant-icon", "?");

    return;
  }

  setText("plant-name", plant.name);

  setText("plant-icon", plant.icon);

  document.title = plant.name + " — Plantora";

  var type = params.get("type");

  var backLink = el("back-link");

  if (backLink && type)
    backLink.href = "plants.html?type=" + type;
}

document.addEventListener(
  "DOMContentLoaded",
  initDashboard
);