const INDOOR_PLANTS = [
  { id: "money",  name: "Money Plant",  icon: "🪴", temp: "24-28°C", hum: "55-70%" },
  { id: "snake",  name: "Snake Plant",  icon: "🌿", temp: "22-30°C", hum: "40-65%" },
  { id: "peace",  name: "Peace Lily",   icon: "🌸", temp: "20-26°C", hum: "60-80%" },
  { id: "aloe",   name: "Aloe Vera",    icon: "🌵", temp: "24-32°C", hum: "25-45%" },
  { id: "spider", name: "Spider Plant", icon: "🌱", temp: "18-28°C", hum: "40-65%" },
];

const OUTDOOR_PLANTS = [
  { id: "rose",      name: "Rose",       icon: "🌹", temp: "20-26°C", hum: "60-75%" },
  { id: "hibiscus",  name: "Hibiscus",   icon: "🌺", temp: "22-30°C", hum: "50-70%" },
  { id: "jasmine",   name: "Jasmine",    icon: "🌼", temp: "20-28°C", hum: "55-75%" },
  { id: "tulsi",     name: "Tulsi",      icon: "🍃", temp: "18-30°C", hum: "40-65%" },
  { id: "sunflower", name: "Sunflower",  icon: "🌻", temp: "20-35°C", hum: "30-60%" },
];

function initPlants() {
  var params = new URLSearchParams(window.location.search);
  var type = params.get("type");
  var badge = document.getElementById("env-badge");
  var grid  = document.getElementById("plant-grid");
  var error = document.getElementById("error-msg");

  var plants;
  if (type === "indoor") {
    plants = INDOOR_PLANTS;
    if (badge) badge.innerHTML = "🌱 Indoor Plants";
  } else if (type === "outdoor") {
    plants = OUTDOOR_PLANTS;
    if (badge) badge.innerHTML = "🌳 Outdoor Plants";
  } else {
    if (grid)  grid.classList.add("hidden");
    if (error) error.classList.remove("hidden");
    return;
  }

  if (!grid) return;

  grid.innerHTML = plants.map(function(p) {
    return '<a href="dashboard.html?plant=' + p.id + '&type=' + type + '" class="plant-card">'
      + '<div class="plant-card-icon">' + p.icon + '</div>'
      + '<div class="plant-card-name">' + p.name + '</div>'
      + '<div class="plant-card-temp">🌡️ ' + p.temp + '</div>'
      + '</a>';
  }).join("");
}

document.addEventListener("DOMContentLoaded", initPlants);