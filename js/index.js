//Weather Api initial data

let API_KEY = "468f937be26c4d91fe63cc0f4b7c0c12";
let apiUrl = "http://api.openweathermap.org/data/2.5/";
let units = 'metric'; //imperial, standard
const OBSOLETE = 3 * 60000; // 30 mins
const DB_NAME = 'WeatherDatabase';
const DB_STORE_NAME = 'cities';
const DB_VERSION = 3;
var db;

// let furl = apiUrl + '/forecast?q=' + cityId + '&units=' + units + '&APPID=' + API_KEY;
// let curl = apiUrl + '/weather?q=' + cityId + '&units=' + units + '&APPID=' + API_KEY;

// Storage variables

let currentWeather;
let forecastWeather;

// DOM elements
let weatherWrapper = document.querySelector('.weatherWrapper');
let searchForm = document.querySelector('.form');
let result = document.querySelector('.result');

// DOM Element Event handlers

document.addEventListener('DOMContentLoaded', domContentLoaded);

document.addEventListener('DOMContentLoaded', showHideWrapper);

function domContentLoaded() {
	navigator.geolocation.getCurrentPosition(weatherByPosition);
}

searchForm.addEventListener('submit', function(e) {
	e.preventDefault();
	let searchInput = e.target.elements['search'];
	forecastByCityId(searchInput.value.trim());
	weatherByCityId(searchInput.value.trim());
});

/*
	XHR Call function versions
*/
function weatherByPosition(position){
	let url = apiUrl + 'weather?lat=' + 
		position.coords.latitude + 
		'&lon='+ position.coords.longitude + 
		'&units=' + units + '&APPID=' + API_KEY;
	XHRCall(url, 'json', displayCurrent);
}

function weatherByCityId(cityId){
	let url = apiUrl + 'weather?q=' + 
			cityId + '&units=' + units + 
			'&APPID=' + API_KEY;
	XHRCall(url, 'json', displayCurrent);
}

function forecastByCityId(cityId) {
	let url = apiUrl + 'forecast?q=' + 
				cityId + '&units=' + units + 
				'&APPID=' + API_KEY;
	XHRCall(url, 'json', displayForecast);
}

function forecastByPosition(position) {
	let url = apiUrl + 'forecast?lat=' + 
		position.coords.latitude + 
		'&lon='+ position.coords.longitude + 
		'&units=' + units + '&APPID=' + API_KEY;
	XHRCall(url, 'json', displayForecast);
}

function XHRCall(url, type, cb) {
	let request = new XMLHttpRequest();
	request.open('GET', url);
	request.responseType = type;
	request.onload = function() {
		if(request.status === 200) {
			cb(request.response);
		} else {
			console.log(request.status + ': ' + request.statusText);
		}
	};
	request.send();
}

/*
	Display Functions
*/

function displayCurrent(weather) {
	console.log(weather);
	updateCurrent(weather);
}

function displayForecast(weather) {
	forecastWeather = weather;
	console.log(weather);
	//result.textContent = JSON.stringify(weather);
	enhanceWeather(weather);
	cleanupObjectStore();
	addDataToDb(weather);
	updateForecast(weather, window.innerWidth || document.documentElement.clientWidth 
				|| document.body.clientWidth);
}

function showHideWrapper() {
	var current = document.querySelector('.current');
	var tableWrapper = document.querySelector('.tableWrapper');
	if(current.firstChild || tableWrapper.firstChild) {
		weatherWrapper.style.display = 'block';
		console.log('block');
	} else {
		weatherWrapper.style.display = 'none';
	}
}

window.onresize = function(event) {
	var w = window.innerWidth 
				|| document.documentElement.clientWidth 
				|| document.body.clientWidth;
	if(forecastWeather) {
		updateForecast(forecastWeather, w);
	}
}

function enhanceWeather(weather) {
	let dateSet = new Set();
	let map = new Map();
	for(var i = 0; i < weather.list.length; i++) {
		let res = getDateTime(weather.list[i].dt_txt);
		weather.list[i].date = res.date;
		weather.list[i].time = res.time;
		dateSet.add(res.date);
		map.set(res.date, []);
	}
	weather.dateSet = dateSet;
	for(const [key, value] of map.entries()) {
		for(var i = 0; i < weather.list.length; i++) {
			if(weather.list[i].date == key) {
				value.push(weather.list[i]);
			}
		}
	}
	weather.map = map;
	
	console.log(weather);
}

function updateCurrent(weather){
	if(!weather) {
		return;
	}
	var old = document.querySelector('.current');
	if(old) {
		old.parentNode.removeChild(old);
	}
	var current = document.createElement('div');
	current.className = 'current';

	var currentHeader = document.createElement('h4');
	currentHeader.classList = ['currentHeader', 'clearfix'].join(' ');

	var currentDate = new Date();
	var day = document.createElement('span');
	day.classList = ['day', 'float-left'].join(' ');
	day.textContent = dateNameByValue('day', currentDate.getDay());

	var date = document.createElement('span');
	date.classList = ['day', 'float-right'].join(' ');
	date.textContent = currentDate.getDate() + ' ' + dateNameByValue('month', currentDate.getMonth());

	current.appendChild(currentHeader);
	currentHeader.appendChild(day);
	currentHeader.appendChild(date);

	var content = document.createElement('div');
	content.className = 'content';

	var location = document.createElement('div');
	location.className = 'location';
	location.textContent = weather.name;

	var weatherData = document.createElement('div');
	weatherData.className = 'weatherData';

	content.appendChild(location);
	content.appendChild(weatherData);

	var temperature = document.createElement('div');
	temperature.className = 'temperature';

	var tempValue = document.createElement('span');
	tempValue.className = 'value';
	tempValue.textContent = weather.main.temp;

	temperature.appendChild(tempValue);

	var unit = document.createElement('span');
	unit.className = 'unit';
	if(units == 'metric') {
		unit.textContent = 'C';
		var celcius = document.createElement('sup');
		celcius.textContent = 'o';
		unit.insertBefore(celcius, unit.firstChild);
	} else {
		unit.textContent = 'F';
	}

	temperature.appendChild(unit);

	var sky = document.createElement('div');
	sky.className = 'sky';

	var skyIcon = document.createElement('i');
	skyIcon.classList = calculateSkyClass(weather.weather[0].icon);

	sky.appendChild(skyIcon);
	weatherData.appendChild(temperature);
	weatherData.appendChild(sky);

	var otherData = document.createElement('ul');
	otherData.className = 'otherData';

	var humidity = document.createElement('li');
	var umbrella = document.createElement('i')
	umbrella.classList = ['wi', 'wi-umbrella'].join(' ');

	humidity.appendChild(umbrella);
	humidity.appendChild(document.createTextNode(weather.main.humidity));
	humidity.appendChild(document.createTextNode('%'));

	var wind = document.createElement('li');
	var windIcon = document.createElement('i')
	windIcon.classList = ['wi', 'wi-strong-wind'].join(' ');

	wind.appendChild(windIcon);
	wind.appendChild(document.createTextNode(weather.wind.speed));
	wind.appendChild(document.createTextNode('m/s'));

	var direction = document.createElement('li');
	var directionIcon = document.createElement('i')
	directionIcon.className = 'direction ' + calculateDirectionClass(weather.wind.deg);

	direction.appendChild(directionIcon);
	direction.appendChild(document.createTextNode(calculateDirectionText(weather.wind.deg)));

	otherData.appendChild(humidity);
	otherData.appendChild(wind);
	otherData.appendChild(direction);

	content.appendChild(otherData);
	current.appendChild(content);

	content.style.backgroundImage = "url('" + calculateImageUrl(weather.weather[0].icon) + "')";

	if(weatherWrapper.firstChild) {
		weatherWrapper.insertBefore(current, weatherWrapper.firstChild);
	} else {
		weatherWrapper.appendChild(current);
	}

	showHideWrapper();
}

function updateForecast(forecastWeather, size){
	if(!forecastWeather) {
		return;
	}
	forecastTable = document.querySelector('.forecast');
	if(forecastTable) {
		forecastTable.parentNode.removeChild(forecastTable);
	}
	if(size > 768) {
		var forecastTable = document.createElement('table');
		forecastTable.classList = 'table forecast';
		var thead = document.createElement('thead');
		var tbody = document.createElement('tbody');

		forecastTable.appendChild(thead);
		forecastTable.appendChild(tbody);

		var thr1 = document.createElement('tr');
		thr1.className = 'mainHeader';
		var tr1 = document.createElement('tr');
		tr1.setAttribute('colSpan', 9);
		tr1.textContent = 'Forecast';

		var thr2 = document.createElement('tr');
		var values = ['Date', '00:00', '03:00', '06:00', '09:00',
							'12:00', '15:00', '18:00', '21:00'];
		for(let i = 0; i < values.length; i++) {
			let elem = document.createElement('th');
			elem.textContent = values[i];
			thr2.appendChild(elem);
		}

		thead.appendChild(thr1);
		thead.appendChild(thr2);
		let index = 0;
		for(const [key, value] of forecastWeather.map.entries()) {
			let tbr = document.createElement('tr');
			tbr.className = 'day';
			let td1 = document.createElement('td');
			let heading1 = document.createElement('h4');
			heading1.className = 'dayOfWeek';
			let dateKey = new Date(key);
			heading1.textContent = dateNameByValue('day', dateKey.getDay());
			let heading2 = document.createElement('h4');
			heading2.className = 'date';
			heading2.textContent = dateKey.getDate() + ' ' + dateNameByValue('month', dateKey.getMonth());
			td1.appendChild(heading1);
			td1.appendChild(heading2);
			tbr.appendChild(td1);
			index ++;
			for(let j = 0; j < value.length; j++) {
				if(value.length === 8) {
					tbr.appendChild(createCell(value[j]));
				} else {
					if(j == 0 && index == 1) {
						let td = document.createElement('td');
						td.textContent = '';
						td.colSpan = 8 - value.length;
						tbr.appendChild(td);
					}
					tbr.appendChild(createCell(value[j]));
				}
			}
			if(index === 6){
				let td = document.createElement('td');
				td.textContent = '';
				td.colSpan = 8 - value.length;
				tbr.appendChild(td);
			}
			tbody.appendChild(tbr);
		}
		
		weatherWrapper.appendChild(forecastTable);
	} else {

	}

	showHideWrapper();
}

function createCell(item) {
	let td = document.createElement('td');
	let sky = document.createElement('div');
	sky.className = 'sky';
	let weatherIcon = document.createElement('i');
	weatherIcon.classList = calculateSkyClass(item.weather[0].icon);
	sky.appendChild(weatherIcon);
	td.appendChild(sky);

	(function (){
		var temperature = document.createElement('div');
		temperature.classList = 'temperature high';
		var tempValue = document.createElement('span');
		tempValue.className = 'value';
		tempValue.textContent = item.main.temp_max;
		temperature.appendChild(tempValue);
		var unit = document.createElement('span');
		unit.className = 'unit';
		if(units == 'metric') {
			unit.textContent = 'C';
			var celcius = document.createElement('sup');
			celcius.textContent = 'o';
			unit.insertBefore(celcius, unit.firstChild);
		} else {
			unit.textContent = 'F';
		}
		temperature.appendChild(unit);
		td.appendChild(temperature);
	})();

	(function (){
		var temperature = document.createElement('div');
		temperature.classList = 'temperature low';
		var tempValue = document.createElement('span');
		tempValue.className = 'value';
		tempValue.textContent = item.main.temp_min;
		temperature.appendChild(tempValue);
		var unit = document.createElement('span');
		unit.className = 'unit';
		if(units == 'metric') {
			unit.textContent = 'C';
			var celcius = document.createElement('sup');
			celcius.textContent = 'o';
			unit.insertBefore(celcius, unit.firstChild);
		} else {
			unit.textContent = 'F';
		}
		temperature.appendChild(unit);
		td.appendChild(temperature);
	})();

	return td;
}


/**
 * IndexedDB utility functions
 *
 * checkIDBSupport()
 * 
 *
 * 
 */


//Local IndexedDB Database

function checkIDBSupport() {
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

	if (!window.indexedDB) {
		window.alert("Your browser doesn't support a stable version of IndexedDB. Some features elliminating HTTP request will not be available.");
		return false;
	} else {
		return true;
	}
}


function openIDB() {
	if(!checkIDBSupport()) {
		return;
	}
	console.log('openIDB ...');
	var req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onsuccess = function (evt) {
		db = this.result;
		console.log("openDb DONE");
	};
	req.onerror = function (evt) {
		console.error("openDb:", evt.target.errorCode);
	};

	req.onupgradeneeded = function (evt) {
		console.log("openDb.onupgradeneeded");
		var store = evt.currentTarget.result.createObjectStore(
	  		DB_STORE_NAME, { keyPath: 'uniqueId'});

		store.createIndex("uniqueId", "uniqueId", { unique: true });
		store.createIndex("value", "value", { unique: false });
	}
}

function getObjectStore(storeName, mode) {
	var transaction = db.transaction(storeName, mode);
	return transaction.objectStore(storeName);
}

function addDataToDb(weather) {
	var uniqueId = generateId(weather.city.coord.lat, weather.city.coord.lon);
	var obj = {'uniqueId' : uniqueId, 'value': weather};
	console.log(obj);
	var store = getObjectStore(DB_STORE_NAME, 'readwrite');
	if(!store) {
		console.log('could not get an object store, cannot add data to db');
	}
   var requestIDB;

	requestIDB = store.add(obj);

	requestIDB.onsuccess = function (evt) {
		console.log("Insertion in DB successful");
	};
	
	requestIDB.onerror = function() {
		console.error("Insertion in DB error", this.error);
	};
}

function clearObjectStore() {
	var store = getObjectStore(DB_STORE_NAME, 'readwrite');
	var requestIDB = store.clear();

	requestIDB.onsuccess = function(event) {
		console.log('database successfully deleted!');
	}
	requestIDB.onerror = function(event) {
		console.error("clearObjectStore:", event.target.errorCode);
	}
}

function searchObjectStore(store, lat, lon) {
	if (typeof store == 'undefined') {
		store = getObjectStore(DB_STORE_NAME, 'readonly');
	}

	var requestIDB;
	var results = [];

	requestIDB = store.openCursor();
	requestIDB.onsuccess = function(event) {
		var cursor = event.target.result;

		if(cursor) {
			console.log('reading cursor data : ', cursor);
			requestIDB = store.get(cursor.key);

			requestIDB.onsuccess = function(event) {
				var value = event.target.result;

				if(isUsableId(lat, lon, value.uniqueID)) {
					results.push(value);
				}
			}
		}
		cursor.continue();
	}
	return results;
}

function cleanupObjectStore(store) {
	if (typeof store == 'undefined') {
		store = getObjectStore(DB_STORE_NAME, 'readwrite');
	}

	var requestIDB;
	var results = [];

	requestIDB = store.openCursor();
	requestIDB.onsuccess = function(event) {
		var cursor = event.target.result;

		if(cursor) {
			console.log('reading cursor data : ', cursor);
			requestIDB = store.get(cursor.key);

			requestIDB.onsuccess = function(event) {
				var value = event.target.result;
				console.log(value);
				console.log(cursor.key);
				if(isObsolete(value.uniqueId)) {
					requestIDB = store.delete(cursor.key);
					requestIDB.onsuccess = function(event) {
						console.log("obsolete data delete successful");
					}
					requestIDB.onerror = function(event) {
						console.error("delete data:", event.target.errorCode);
					}
				}
			}
		}
		cursor.continue();
	}
	requestIDB.onerror = function (event) {
		console.error("cleanup:", event.target.errorCode);
	};
}


/**
 * Utility functions
 * 
 */

function getDateTime(dateString) {
	let dateArr = dateString.split(' ');
	return {
		date: dateArr[0],
		time: dateArr[1].substr(0,5)
	};
}

function dateNameByValue(type, value) {
	var res;
	switch(type) {
		case 'day':
			switch(value) {
				case 0:
					res = 'Sunday';
					break;
				case 1:
					res = 'Monday';
					break;
				case 2:
					res = 'Tuesday';
					break;
				case 3:
					res = 'Wednesday';
					break;
				case 4:
					res = 'Thursday';
					break;
				case 5:
					res = 'Friday';
					break;
				case 6:
					res = 'Saturday';
					break;
				default:
					res = '';
			}
			break;
		case 'month':
			switch(value) {
				case 0:
					res = 'Jan';
					break;
				case 1:
					res = 'Feb';
					break;
				case 2:
					res = 'Mar';
					break;
				case 3:
					res = 'Apr';
					break;
				case 4:
					res = 'May';
					break;
				case 5:
					res = 'Jun';
					break;
				case 6:
					res = 'Jul';
					break;
				case 7:
					res = 'Aug';
					break;
				case 8:
					res = 'Sep';
					break;
				case 9:
					res = 'Oct';
					break;
				case 10:
					res = 'Nov';
					break;
				case 11:
					res = 'Dec';
				default:
					res = '';
			}
			break;
		default:
			res = '';
			break;
	}
	return res;
}

function calculateDirectionText(angle) {
	let calculatedText = "Spread";
	if((angle >= 337.5 && angle < 360 ) || ( angle >= 0 && angle < 22.5 )) {
		calculatedText = "East";
	}
	if(angle >= 22.5 && angle < 67.5) {
		calculatedText = "North East";
	}
	if(angle >= 67.5 && angle < 112.5) {
		calculatedText = "North";
	}
	if(angle >= 112.5 && angle < 157.5) {
		calculatedText = "North West";
	}
	if(angle >= 157.5 && angle < 202.5) {
		calculatedText = "West";
	}
	if(angle >= 202.5 && angle < 247.5) {
		calculatedText = "South West";
	}
	if(angle >= 247.5 && angle < 292.5) {
		calculatedText = "South";
	}
	if(angle >= 292.5 && angle < 337.5 ) {
		calculatedText = "South East";
	}

	return calculatedText;
}

function calculateDirectionClass(angle) {
	let calculatedClass = "wi wi-wind ";
	if(angle !== undefined) {
		calculatedClass += "from-" + Math.round(angle) + "-deg";
	}
	return calculatedClass;
}

function calculateSkyClass(icon) {
	let calculatedClass = "wi ";
	switch(icon) {
		case '01d':
			calculatedClass += "wi-day-sunny";
			break;
		case '01n':
			calculatedClass += "wi-night-clear";
			break;
		case '02d':
			calculatedClass += "wi-day-cloudy";
			break;
		case '02n':
			calculatedClass += "wi-night-cloudy";
			break;
		case '03d':
		case '03n':
			calculatedClass += "wi-cloud";
			break;
		case '04d':
		case '04n':
			calculatedClass += "wi-cloudy";
			break;
		case '09d':
			calculatedClass += "wi-day-showers";
			break;
		case '09n':
			calculatedClass += "wi-night-showers";
			break;
		case '10d':
			calculatedClass += "wi-day-rain";
			break;
		case '10n':
			calculatedClass += "wi-night-rain";
			break;
		case '11d':
			calculatedClass += "wi-day-thunderstorm";
			break;
		case '11n':
			calculatedClass += "wi-night-thunderstorm";
			break;
		case '13d':
			calculatedClass += "wi-day-snow";
			break;
		case '13n':
			calculatedClass += "wi-night-snow";
			break;
		case '50d':
			calculatedClass += "wi-day-fog";
			break;
		case '50n':
			calculatedClass += "wi-night-fog";
			break;
		default:
			calculatedClass += "wi-day-sunny";
	}
	return calculatedClass;
}

function calculateImageUrl(icon) {
	let calculatedImageUrl = "./images/";
	switch(icon) {
		case '01d':
			calculatedImageUrl += "day-sunny.jpg";
			break;
		case '01n':
			calculatedImageUrl += "night-stars.jpg";
			break;
		case '02d':
			calculatedImageUrl += "day-sunny.jpg";
			break;
		case '02n':
			calculatedImageUrl += "night-stars.jpg";
			break;
		case '03d':
		case '03n':
			calculatedImageUrl += "day-night-cloudy.jpg";
			break;
		case '04d':
		case '04n':
			calculatedImageUrl += "day-night-cloudy.jpg";
			break;
		case '09d':
			calculatedImageUrl += "day-showers.jpg";
			break;
		case '09n':
			calculatedImageUrl += "night-showers.jpg";
			break;
		case '10d':
			calculatedImageUrl += "day-rainy.jpg";
			break;
		case '10n':
			calculatedImageUrl += "night-rainy.jpg";
			break;
		case '11d':
			calculatedImageUrl += "day-thunderstorm.jpg";
			break;
		case '11n':
			calculatedImageUrl += "night-thunderstorm.jpg";
			break;
		case '13d':
			calculatedImageUrl += "day-snowy.jpg";
			break;
		case '13n':
			calculatedImageUrl += "night-snowy.jpg";
			break;
		case '50d':
			calculatedImageUrl += "day-foggy.jpg";
			break;
		case '50n':
			calculatedImageUrl += "night-foggy.jpg";
			break;
		default:
			calculatedImageUrl += "day-sunny.jpg";
	}
	return calculatedImageUrl;
}

function generateId(lat, lon) {
	let date = new Date();
	let res = +date;
	res += '_' + lat + '_' + lon;
	console.log(res);
	return res;
}

function isObsolete(id) {
	if(!id) {
		return false;
	}
	let date = new Date();
	let arr = id.split('_');
	let diff = +date - parseInt(arr[0]);
	if(diff <= OBSOLETE) {
		return false;
	} else {
		return true;
	}
}

function isUsableId(lat, lon, oldId) {
	if(!isObsolete(oldId)) {
		let arr = oldId.split('_');
		if(lat.toFixed(2) == parseFloat(arr[1]).toFixed(2) && 
			lon.toFixed(2) == parseFloat(arr[2]).toFixed(2)) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}


openIDB();

