const CRUD_URL = "https://6943fb277dd335f4c35ed2e1.mockapi.io/meteo";

const weatherData = {
 0: { icon: "img/sunny.png", desc: "Cielo sereno" },
 1: { icon: "img/mostly_sunny.png", desc: "Poco nuvoloso" },
 2: { icon: "img/partly_cloudy.png", desc: "Poco nuvoloso" },
 3: { icon: "img/mostly_cloudy_day.png", desc: "Nuvoloso" },
 45: { icon: "img/cloudy.png", desc: "Nebbia" },
 48: { icon: "img/cloudy.png", desc: "Nebbia" },
 51: { icon: "img/rain_light.png", desc: "Pioviggine" },
 53: { icon: "img/rain_light.png", desc: "Pioviggine" },
 55: { icon: "img/rain_light.png", desc: "Pioviggine" },
 80: { icon:"img/sunny_s_rain.png", desc: "Soleggiato con pioggia" },
 81: { icon:"img/rain_s_sunny.png", desc: "Pioggia con sole" },
 82: { icon:"img/rain_s_sunny.png", desc: "Pioggia con sole" },
 61: { icon: "img/rain.png", desc: "Pioggia" },
 63: { icon: "img/rain_heavy.png", desc: "Pioggia" },
 65: { icon: "img/rain_heavy.png", desc: "Pioggia" },
 56: { icon: "img/snow_s_rain.png", desc: "Neve con pioggia"},
 57: { icon: "img/snow_s_rain.png", desc: "Neve con pioggia"},
 66: { icon: "img/rain_s_snow.png", desc: "Pioggia con neve"},
 67: { icon: "img/rain_s_snow.png", desc: "Pioggia con neve"},
 77: { icon: "img/snow_s_cloudy.png", desc: "Nuvoloso con neve"},
 71: { icon: "img/snow_light.png", desc: "Neve" },
 73: { icon: "img/snow.png", desc: "Neve" },
 75: { icon: "img/snow_heavy.png", desc: "Neve" },
 85: { icon: "img/snow_s_cloudy.png", desc: "Rovesci di neve" },
 86: { icon: "img/snow_s_cloudy.png", desc: "Rovesci di neve" },
 95: { icon: "img/thunderstorms.png", desc: "Temporale" },
 96: { icon: "img/thunderstorms.png", desc: "Temporale con grandine" },
 99: { icon: "img/thunderstorms.png", desc: "Temporale con grandine" }
 };

const form = document.getElementById("src_form");
const place = document.getElementById("place");
const saveBtn = document.getElementById("save_button");
const searchBtn = document.getElementById("src_button");
const meteo = document.getElementById("meteo");
const statusEl = document.getElementById("status");
const locationList = document.getElementById("location_saved");

//Sezione ricerca meteo

async function coordinate(nomeluogo) {
    try{
        let risposta = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${nomeluogo}&count=1`);
        if(!risposta.ok){
            throw new Error("Errore HTTP: " + risposta.status);
        }
        let data = await risposta.json();
     
        if (!data.results || data.results.length === 0) {
            throw new Error("Nessun risultato trovato");
        }

        let dati = data.results[0];
        let latitudine = dati.latitude;
        let longitudine = dati.longitude;
        console.log(`Coordinate di ${nomeluogo}: Latitudine ${latitudine}, Longitudine ${longitudine}`);
        return {longitudine, latitudine};
    }catch (errore) {
        console.error("Errore: ", errore);
    }
};

searchBtn.addEventListener("click", async function(e) {
    e.preventDefault();
    let coord = await coordinate(place.value);
    if (coord) {
        previsioni_meteo(coord.latitudine, coord.longitudine, place.value);
    }
});

async function previsioni_meteo(latitudineLuogo, longitudineLuogo, nomeluogo) {
    try {
        const risposta = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitudineLuogo}&longitude=${longitudineLuogo}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
        );

        if (!risposta.ok) {
            throw new Error("Errore HTTP: " + risposta.status);
        }

        const data = await risposta.json();
        console.log(data);

        meteo.innerHTML = `<h2>Meteo a ${nomeluogo}</h2>`;

        for (let i = 0; i < data.daily.time.length; i++) {
            const codice = data.daily.weather_code[i];
            const max = data.daily.temperature_2m_max[i];
            const min = data.daily.temperature_2m_min[i];
            const alba = data.daily.sunrise[i].split("T")[1];
            const tramonto = data.daily.sunset[i].split("T")[1];
            const giorno = data.daily.time[i];

            const card = document.createElement("div");
            card.classList.add("giorno-meteo");

            const titolo = document.createElement("h3");
            titolo.textContent = giorno;

            const img = document.createElement("img");
            if (weatherData[codice]) {
                img.src = weatherData[codice].icon;
                img.alt = weatherData[codice].desc;
            }

            const descrizione = document.createElement("p");
            descrizione.textContent = weatherData[codice]?.desc || "Meteo sconosciuto";

            const temp = document.createElement("p");
            temp.textContent = `🌡️ Max ${max}°C / Min ${min}°C`;

            const sole = document.createElement("p");
            sole.textContent = `🌅 Alba: ${alba} — 🌇 Tramonto: ${tramonto}`;

            card.appendChild(titolo);
            card.appendChild(img);
            card.appendChild(descrizione);
            card.appendChild(temp);
            card.appendChild(sole);

            meteo.appendChild(card);
        }

    } catch (errore) {
        console.error("Errore:", errore);
    }
}


let temperatura_luogo = null;

async function temperaturaLuogo(latitudineLuogo, longitudineLuogo){
    try{
        let risposta = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitudineLuogo}&longitude=${longitudineLuogo}&current=temperature_2m&timezone=auto`);
        if(!risposta.ok){
            throw new Error("Errore HTTP: " + risposta.status);
        }
        let data = await risposta.json();
        temperatura_luogo = data.current.temperature_2m;
        return temperatura_luogo;
    }catch (errore) {
        console.error("Errore: ", errore);
    }
};

//Sezione salvataggio luoghi

let locations = [];

let editingId = null;

async function loadLocations(){
    statusEl.innerHTML = "Loading...";

    try{
        const response = await fetch(CRUD_URL);
        if(!response.ok){
            throw new Error("Errore nel caricamento");
        }
        locations = await response.json();

        generateList(locations);
    }catch(error){
        console.log("Error: " + error)
        statusEl.innerHTML = "Impossibile caricare i dati!";
    }finally{
        statusEl.innerHTML = "";
    }
};

async function generateList(data) {
    locationList.innerHTML = "";

    if (data.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "empty-message";
        emptyMsg.textContent = "Nessun luogo salvato. Aggiungi una città!";
        locationList.appendChild(emptyMsg);
        return;
    }

    for (const location of data) {
        const temp = await temperaturaLuogo(location.lat, location.lon);

        const li = document.createElement("li");
        li.dataset.id = location.id;

        li.innerHTML = `
            <div class="locationCard">
                <div class="location-header">
                    <span class="luogo">${location.luogo}</span>
                    <span class="temperatura">${Math.round(temp)}°C</span>
                </div>
                <div class="location-details">
                    <div class="coordinate">Lat: ${location.lat.toFixed(4)}</div>
                    <div class="coordinate">Lon: ${location.lon.toFixed(4)}</div>
                </div>
                <div class="button-container">
                    <button class="delete">Elimina</button>
                    <button class="show">Mostra</button>
                </div>
            </div>
        `;

        locationList.appendChild(li);
    }
}

locationList.addEventListener("click", e=>{
    const li = e.target.closest("li");
    if(!li) return;

    const id = li.dataset.id;
    if(e.target.closest('.show')){
        showLocation(id);
    }
    if(e.target.closest('.delete')){
        deleteLocation(id);
    }
});

function showLocation(id){
    const location = locations.find(s => s.id === String(id));
    if(!location) return;
    place.value = location.luogo;
    previsioni_meteo(location.lat, location.lon, location.luogo);
    editingId = String(id);
    highlightSelectedLocation(String(id));
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    searchBtn.click();
});


saveBtn.addEventListener("click", async () => {
    let coord = await coordinate(place.value);
    if (!coord) return;

    const exists = locations.some(
        loc => loc.luogo.toLowerCase() === place.value.trim().toLowerCase()
    );

    if (exists && !editingId) {
        statusEl.innerHTML = `Il luogo "${place.value}" è già salvato!`;
        return;
    }

    const payload = {
        luogo: place.value.trim(),
        lat: coord.latitudine,
        lon: coord.longitudine,
    };

    try {
        if (editingId) {
            await updateLocation(editingId, payload);
        } else {
            await createLocation(payload);
        }

        editingId = null;
        form.reset();
        statusEl.innerHTML = "";
        loadLocations();
    } catch (error) {
        console.log("Error: " + error);
        statusEl.innerHTML = "Errore nel salvataggio.";
    }
});



async function createLocation(payload) {
    const response = await fetch(CRUD_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });
    if(!response.ok) throw new Error("Errore creazione!");
};

async function updateLocation(id, payload){
    const response = await fetch(`${CRUD_URL}/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });
    if(!response.ok) throw new Error("Errore update!");
};
async function deleteLocation(id) {
    const confirmdelete = confirm("Sei sicuro di voler eliminare questo luogo!")
    if(!confirmdelete) return;
    const response = await fetch(`${CRUD_URL}/${id}`,{
        method: "DELETE"
    });
    if(!response.ok) throw new Error("Errore eliminazione!");
    await loadLocations();
}
loadLocations();


function highlightSelectedLocation(id) {
    document.querySelectorAll('#location_saved li').forEach(li => {
        li.classList.remove('location-selected');
    });
    const selectedLi = document.querySelector(`#location_saved li[data-id="${id}"]`);
    if (selectedLi) {
        selectedLi.classList.add('location-selected');
    }
}
