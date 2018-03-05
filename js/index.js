(function() {

'use strict';

/**
 * Initial Variables and Constants
 */

const API_KEY = "468f937be26c4d91fe63cc0f4b7c0c12";
const apiUrl = "http://api.openweathermap.org/data/2.5/";
const units = 'metric'; //metric, imperial, standard
const OBSOLETE_MINUTES = 3;
const OBSOLETE = OBSOLETE_MINUTES * 60000;
const DB_NAME = 'WeatherDatabase';
const DB_FORECASTS = 'forecasts';
const DB_CURRENTS = 'currents';
const DB_VERSION = 3;
let db;
let wSize;

/**
 * let furl = apiUrl + '/forecast?q=' + cityId + '&units=' + units + '&APPID=' + API_KEY;
 *
 * let curl = apiUrl + '/weather?q=' + cityId + '&units=' + units + '&APPID=' + API_KEY;
 *
 * http://api.openweathermap.org/data/2.5/forecast?lat=40.1791857&lon=44.4991029&units=metric&APPID=468f937be26c4d91fe63cc0f4b7c0c12
 */

/**
 * Storage variables
 */

let storage = {
	'forecasts' : [],
	'currents' : [],
	'current': {},
	'forecast': {}
};

/**
 * DOM elements
 */

let weatherWrapper = document.querySelector('.weatherWrapper');
let searchForm = document.querySelector('.form');
let result = document.querySelector('.result');
let deleteIDBBtn = document.querySelector('.deleteIDB');
let cleanupIDBBtn = document.querySelector('.cleanupIDB');

/**
 * DOM Element Event handlers
 */

document.onreadystatechange = function() {
	if(document.readyState === 'interactive') {
		domContentLoaded();
	} else if(document.readyState === 'complete') {
		loadCurrents();
		loadForecasts();
	}
}
function domContentLoaded() {
	wSize = window.innerWidth 
				|| document.documentElement.clientWidth 
				|| document.body.clientWidth;
	showHideWrapper();
	openIDB();
	navigator.geolocation.getCurrentPosition(weatherByPosition);
}

searchForm.addEventListener('submit', function(e) {
	e.preventDefault();
	let searchInput = e.target.elements['search'];
	let cityId = searchInput.value.trim();
	let res = checkCityInStorage(cityId);
	if(res.current) {
		displayCurrent(res.current.weather);
	} else {
		weatherByCityId(cityId);
	}

	if(res.forecast) {
		displayForecast(res.forecast.weather);
	} else {
		forecastByCityId(cityId);
	}
});

deleteIDBBtn.addEventListener('click', function(e) {
	clearObjectStore(DB_FORECASTS);
	clearObjectStore(DB_CURRENTS);
});

cleanupIDBBtn.addEventListener('click', function(e) {
	cleanupObjectStore(DB_FORECASTS);
	cleanupObjectStore(DB_CURRENTS);
});

window.onresize = function(event) {
	wSize = window.innerWidth 
		|| document.documentElement.clientWidth 
		|| document.body.clientWidth;
	updateForecast(storage.forecast);
	updateCurrent(storage.current);
}

function initializeToggles() {
	let togglesList = document.querySelectorAll('.toggle');
	togglesList.forEach(function(item) {item.addEventListener('click', function(event) {
		event.preventDefault();
		let items = this.parentNode.querySelector('.items');
		if(items.style.display == 'none') {
			items.style.display = 'block';
		} else {
			items.style.display = 'none';
		}
	})});
}


/**
 * In Memory Manipulation functions
 */

function loadStorage(objectStore, array) {
	let store = getObjectStore(objectStore, 'readonly');
	let req;
	req = store.openCursor();
	req.onsuccess = function(event) {
		let cursor = event.target.result;
		if(cursor) {
			req = store.get(cursor.key);
			req.onsuccess = function(event) {
				array.push(event.target.result);
			}
			cursor.continue();
		}
	}
}

function loadCurrents() {
	loadStorage(DB_CURRENTS, storage.currents);
}
function loadForecasts() {
	loadStorage(DB_FORECASTS, storage.forecasts);
}

function checkCityInStorage(cityId) {
	let curr;
	let forc;
	let res = {};
	for(let i = 0; i < storage.forecasts.length; i++) {
		if(!isObsolete(storage.forecasts[i].uniqueId) && (cityId.toLowerCase() == storage.forecasts[i].weather.city.name.toLowerCase())) {
				forc = storage.forecasts[i];
		}
	}
	for(let i = 0; i < storage.currents.length; i++) {
		if(!isObsolete(storage.currents[i].uniqueId) && (cityId.toLowerCase() == storage.currents[i].weather.name.toLowerCase())) {
				curr = storage.currents[i];
		}
	}
	if(curr) {
		res.current = curr;
	}
	if(forc) {
		res.forecast = forc;
	}
	return res;
}

function writeStorageToDb(objectStore, array) {
	var store = getObjectStore(objectStore, 'readwrite');
	if(!store) {
		//$.notify({message: 'could not get an object store, cannot add data to db'},{type: 'danger'})
		console.log('could not get an object store, cannot add data to db');
		return;
	}

	var req = store.clear();

	req.onsuccess = function(event) {
		// $.notify({message: 'Object storage successfully deleted!'},
		// 			{type: 'success'});
		console.log('Object storage successfully deleted!');		

		for(let i = 0; i < array.length; i++) {
			req = store.add(array[i]);

			req.onsuccess = function (event) {
				//$.notify({message: 'Insertion in DB successful'},
					//{type: 'success'});
				console.log('Insertion in DB successful!');
			};
			
			req.onerror = function() {
				//$.notify({message: 'Insertion in DB error'},
					//{type: 'danger'});
				console.log('Insertion in DB error!');
			};
		}
	}
	req.onerror = function(event) {
		console.error("clearObjectStore:", event.target.errorCode);
	}
}

function writeForecastsToDb() {
	writeStorageToDb(DB_FORECASTS, storage.forecasts);
}

function writeCurrentsToDb() {
	writeStorageToDb(DB_CURRENTS, storage.currents);
}

function cleanupForecasts() {
	storage.forecasts = storage.forecasts.filter(item => !isObsolete(item.uniqueId));
}

function cleanupCurrents() {
	storage.currents = storage.currents.filter(item => !isObsolete(item.uniqueId));
}

/**
 * Display Functions
 */

function displayCurrent(weather) {
	if(!weather) {
		updateCurrent(storage.current);
	} else {
		storage.current = weather;
		updateCurrent(weather);
	}
}

function displayForecast(weather) {
	if(!weather) {
		updateForecast(storage.forecast);
	} else {
		storage.forecast = weather;
		updateForecast(weather)
	}
	
}

function prepareForecastToDisplay(weather) {
	enhanceWeather(weather);
	cleanupForecasts();
	let uniqueId = generateId(weather.city.coord.lat, weather.city.coord.lon);
	let obj = {'uniqueId': uniqueId, 'weather': weather};
	storage.forecasts.push(obj);
	console.log(weather);
	displayForecast(weather);
	writeForecastsToDb();
}

function prepareCurrentToDisplay(weather) {
	cleanupCurrents();
	let uniqueId = generateId(weather.coord.lat, weather.coord.lon);
	let obj = {'uniqueId': uniqueId, 'weather': weather};
	storage.currents.push(obj);
	console.log(weather);
	displayCurrent(weather);
	writeCurrentsToDb();
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
}

function displayByPosition(position) {
	weatherByPosition(position);
	forecastByPosition(position);
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

function updateForecast(weather){
	if(!weather) {
		return;
	}
	var mobileViewOld = document.querySelector('.mobileView');
	if(mobileViewOld) {
		mobileViewOld.parentNode.removeChild(mobileViewOld);
	}
	var forecastTableOld = document.querySelector('.forecast');
	if(forecastTableOld) {
		forecastTableOld.parentNode.removeChild(forecastTableOld);
	}
	
	if(wSize > 992) {
		
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
		for(const [key, value] of weather.map.entries()) {
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
		let mobileView = document.createElement('div');
		mobileView.className = 'mobileView';

		let mobile = document.createElement('ul');
		mobile.className = 'mobile';

		mobileView.appendChild(mobile);

		for(let i = 0; i < 5; i++) {
			let day = document.createElement('li');
			day.className = 'day';

			let toggle = document.createElement('a');
			toggle.className = 'toggle';

			let currentHeader = document.createElement('h4');
			currentHeader.classList = 'currentHeader clearfix';

			let weekday = document.createElement('span');
			weekday.classList = 'day float-left';
			weekday.textContent = 'Friday';

			let monthday = document.createElement('span');
			monthday.classList = 'day float-right';
			monthday.textContent = '2 Mar';

			currentHeader.appendChild(weekday);
			currentHeader.appendChild(monthday);
			toggle.appendChild(currentHeader);
			day.appendChild(toggle);


			let items = document.createElement('div');
			items.className = 'items';

			for(let j = 0; j < 4; j++) {
				let item = document.createElement('ul');
				item.className = 'item';

				let daytime = document.createElement('li');
				daytime.className = 'daytime';
				daytime.textContent = 'Night';

				item.appendChild(daytime);

				for(let k = 0; k < 2; k++) {

					let hour = document.createElement('li');
					hour.className = 'hour';

					let time = document.createElement('span');
					time.className = 'time';

					hour.appendChild(time);

					let sky = document.createElement('div');
					sky.className = 'sky';

					let icon = document.createElement('i');
					icon.classList = 'wi wi-cloud';

					sky.appendChild(icon);
					hour.appendChild(sky);

					let tempH = document.createElement('div');
					tempH.classList = 'temperature high';
					let valueH = document.createElement('span');
					valueH.className = 'value';
					valueH.textContent = '7.18';

					let unitH = document.createElement('span');
					unitH.className = 'unit';

					tempH.appendChild(valueH);
					tempH.appendChild(unitH);


					let tempL = document.createElement('div');
					tempL.classList = 'temperature low';
					let valueL = document.createElement('span');
					valueL.className = 'value';
					valueL.textContent = '3.18';

					let unitL = document.createElement('span');
					unitL.className = 'unit';
					
					tempL.appendChild(valueL);
					tempL.appendChild(unitL);

					hour.appendChild(tempH);
					hour.appendChild(tempL);
					item.appendChild(hour);
				}

			items.appendChild(item);
			}

			day.appendChild(items);
			mobile.appendChild(day);
		}
		let tableWrapper = document.querySelector('.tableWrapper');
		tableWrapper.appendChild(mobileView);
		//weatherWrapper.removeChild(forecastTable);
		initializeToggles();
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

function showHideWrapper() {
	var current = document.querySelector('.current');
	var tableWrapper = document.querySelector('.tableWrapper');
	if(current.firstChild || tableWrapper.firstChild) {
		weatherWrapper.style.display = 'block';
	} else {
		weatherWrapper.style.display = 'none';
	}
}

/**
 * IndexedDB utility functions
 *
 * checkIDBSupport()
 * openIDB()
 * getObjectStore(storeName, mode)
 * addDataToDb(weather)
 * clearObjectStore()
 * cleanupObjectStore()
 */

function checkIDBSupport() {
	// indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	// IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
	// IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

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
	//$.notify({message: 'openIDB ...'},
					//{type: 'info'});
	console.log('openIDB ...');
	var req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onsuccess = function (evt) {
		db = this.result;
		//$.notify({message: 'openDb DONE'},
					//{type: 'success'});
		console.log('openDb DONE');
	};

	req.onerror = function (evt) {
		//$.notify({message: "openDb: " + evt.target.errorCode},
					//{type: 'danger'});
		console.log('openDb: ', evt.target.errorCode);
	};

	req.onupgradeneeded = function (evt) {
		console.log("openDb.onupgradeneeded");
		var store = evt.currentTarget.result.createObjectStore(
	  		DB_FORECASTS, { keyPath: 'uniqueId'});

		store.createIndex("uniqueId", "uniqueId", { unique: true });
		store.createIndex("weather", "weather", { unique: false });

		var storeC = evt.currentTarget.result.createObjectStore(
	  		DB_CURRENTS, { keyPath: 'uniqueId'});

		storeC.createIndex("uniqueId", "uniqueId", { unique: true });
		storeC.createIndex("weather", "weather", { unique: false });
	}
}

function addDataToDb(weather) {
	var uniqueId = generateId(weather.city.coord.lat, weather.city.coord.lon);
	var obj = {'uniqueId' : uniqueId, 'weather': weather};
	console.log(obj);
	var store = getObjectStore(DB_FORECASTS, 'readwrite');
	if(!store) {
		console.log('could not get an object store, cannot add data to db');
		store;
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

function getObjectStore(storeName, mode) {
	var transaction = db.transaction(storeName, mode);
	return transaction.objectStore(storeName);
}

function clearObjectStore(objectStore) {
	var store = getObjectStore(objectStore, 'readwrite');
	var requestIDB = store.clear();

	requestIDB.onsuccess = function(event) {
		console.log('database successfully deleted!');
	}
	requestIDB.onerror = function(event) {
		console.error("clearObjectStore:", event.target.errorCode);
	}
}

function cleanupObjectStore(objectStore) {
	let store = getObjectStore(objectStore, 'readwrite');

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

				if(isObsolete(value.uniqueId)) {
					requestIDB = store.delete(cursor.key);
					requestIDB.onsuccess = function(event) {
						console.log(value.uniqueId, " : obsolete data delete successful");
					}
					requestIDB.onerror = function(event) {
						console.error("delete data:", event.target.errorCode);
					}
				}
			}
			cursor.continue();
		}
	}
	requestIDB.onerror = function (event) {
		console.error("cleanup:", event.target.errorCode);
	};
}


/**
 * XHR Call function versions
 *
 * weatherByPosition(position)
 * weatherByCityId(cityId)
 * forecastByPosition(position)
 * forecastByCityId(cityId)
 * XHRCall(url, type, cb)
 */

function weatherByPosition(position){
	let url = apiUrl + 'weather?lat=' + 
		position.coords.latitude + 
		'&lon='+ position.coords.longitude + 
		'&units=' + units + '&APPID=' + API_KEY;
	XHRCall(url, 'json', prepareCurrentToDisplay);
}

function weatherByCityId(cityId){
	let url = apiUrl + 'weather?q=' + 
			cityId + '&units=' + units + 
			'&APPID=' + API_KEY;
	XHRCall(url, 'json', prepareCurrentToDisplay);
}

function forecastByPosition(position) {
	let url = apiUrl + 'forecast?lat=' + 
		position.coords.latitude + 
		'&lon='+ position.coords.longitude + 
		'&units=' + units + '&APPID=' + API_KEY;
	XHRCall(url, 'json', prepareForecastToDisplay);
}

function forecastByCityId(cityId) {
	let url = apiUrl + 'forecast?q=' + 
				cityId + '&units=' + units + 
				'&APPID=' + API_KEY;
	XHRCall(url, 'json', prepareForecastToDisplay);
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


/**
 * Utility functions
 *
 * getDateTime(dateString)
 * dateNameByValue(type, value)
 * calculateDirectionText(angle)
 * calculateDirectionClass(angle)
 * calculateSkyClass(icon)
 * calculateImageUrl(icon)
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

/**
 * DB Id manipulation functions
 *
 * generateId(lat, lon)
 * isObsolete(id)
 * isUsableId(lat, lon, oldId)
 */


function generateId(lat, lon) {
	let date = new Date();
	let res = +date;
	res += '_' + lat + '_' + lon;
	return res;
}

function isObsolete(id) {
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

})();