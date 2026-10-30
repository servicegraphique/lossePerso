const form = document.getElementById("search-form");
const input = document.getElementById("address");
const statusEl = document.getElementById("status");

const map = L.map("map").setView([43.4641, 5.60797], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

let marker = null;

async function geocode(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("Erreur réseau (" + res.status + ")");
  }

  const data = await res.json();
  if (!data.length) {
    throw new Error("Adresse introuvable");
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    label: data[0].display_name,
  };
}

function showPlace(place, query) {
  map.setView([place.lat, place.lon], 17);

  if (marker) {
    marker.setLatLng([place.lat, place.lon]);
  } else {
    marker = L.marker([place.lat, place.lon]).addTo(map);
  }

  marker.bindPopup("<strong>" + query + "</strong><br>" + place.label).openPopup();
  statusEl.textContent =
    "Coordonnées : " + place.lat.toFixed(6) + ", " + place.lon.toFixed(6);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  statusEl.textContent = "Recherche…";

  try {
    const place = await geocode(query);
    showPlace(place, query);
  } catch (err) {
    statusEl.textContent = err.message;
  }
});

form.dispatchEvent(new Event("submit"));
