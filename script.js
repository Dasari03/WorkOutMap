"use strict";
const workOutFormContainer = document.querySelector(".workout-form-container");
const workOutForm = document.querySelector(".workout-form");
const container = document.querySelector(".container");
const inputDistance = document.querySelector(".input-distance");

const inputDuration = document.querySelector(".input-duration");

const inputCadence = document.querySelector(".input-cadence");

const inputElevation = document.querySelector(".input-elevation");

const cadenceForm = document.querySelector(".cadence-form");
const elevationForm = document.querySelector(".elevation-form");

const typeOfSport = document.querySelector(".form-answer");

// const form = document.querySelector(".form");

class Workout {
  clicks = 0;
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettire-ignore
    const months = [
      "January",
      "Febuary",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//////////////////////////////////////////////////////////
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getLocalStorage();
    this._getPosition();
    typeOfSport.addEventListener("change", this._toggleElevationField);
    workOutForm.addEventListener("submit", this._newWorkout.bind(this));
    container.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Failed to get your location...");
        }
      );
    }
  }
  _loadMap(position) {
    const { longitude } = position.coords;
    const { latitude } = position.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude},14z`);
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));

    //getLocalStorage method that will be executed when map is fully loaded first.
    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;

    workOutForm.classList.remove("hidden");

    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value = inputDistance.value = inputDuration.value = "";
    workOutForm.classList.add("hidden");
  }
  _toggleElevationField() {
    //   cadenceForm.classList.toggle("hidden");
    inputCadence.closest(".form").classList.toggle("hidden");
    //   elevationForm.classList.toggle("hidden");
    elevationForm.closest(".form").classList.toggle("hidden");
  }
  _newWorkout(e) {
    e.preventDefault();
    //get data from form
    const validInput = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const isAllPositive = (...inputs) => inputs.every((inp) => inp > 0);
    const type = typeOfSport.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //check if data is valid

    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validInput(distance, duration, cadence) ||
        !isAllPositive(distance, duration, cadence)
      )
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        return alert(`It is not a finite number...`);
      //if workout running, create running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout cycling, create cycling object

    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInput(distance, duration, elevation) ||
        !isAllPositive(distance, duration)
      )
        return alert("It is not a correct input...");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //add new object to workout array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);
    //render workout on list
    this._renderWorkout(workout);

    //hide form + clear input fields
    this._hideForm();
    // inputCadence.value = inputDistance.value = inputDuration.value = "";

    //Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃🏻‍♂️" : "🚴🏼"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <h2 class="workout__title">${workout.description}</h2>
    <li class="workout" data-id="${workout.id}">
        
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃🏻‍♂️" : "🚴🏼"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🥇</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>
      `;
    if (workout.type === "running") {
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>
      `;
    }
    if (workout.type === "cycling") {
      html += `<div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.speed.toFixed(
                    1
                  )}</span>
                  <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                  <span class="workout__icon">🚵🏼‍♂️</span>
                  <span class="workout__value">${workout.elevationGain}</span>
                  <span class="workout__unit">m</span>
              </div>
          </li>
        `;
    }
    workOutForm.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const targetEl = e.target.closest(".workout");

    if (!targetEl) return;
    const newTarget = this.#workouts.find(
      (workout) => workout.id === targetEl.dataset.id
    );

    this.#map.setView(newTarget.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //When we use local Storage and use 'stingify' and 'parse', prototype inheritence will be cleared and ended up just becoming regular object.
    // newTarget.click();
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const workoutData = JSON.parse(localStorage.getItem("workouts"));

    if (!workoutData) return;

    this.#workouts = workoutData;

    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
