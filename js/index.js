//Weather Api initial data

let API_KEY = "468f937be26c4d91fe63cc0f4b7c0c12";
let apiUrl = "http://api.openweathermap.org/data/2.5/";
let cityId = 'Washington';
//let url = apiUrl + '/forecast?id=' + cityId + '&units=metric&APPID=' + API_KEY;
//let locationUrl = apiUrl + 'weather?lat=' + position.coords.latitude + '&lon='+ position.coords.longitude + '&units=metric&APPID=' + API_KEY;
let units = 'metric'; //imperial, standard
let url = apiUrl + '/forecast?q=' + cityId + '&units=' + units + '&APPID=' + API_KEY;

// Storage variables

let currentWeather;
let forecastWeather;

// DOM elements
let darkWeatherHourly = document.querySelector('.darkWeatherHourly');
let weatherWrapper;
let buttonPrimary = document.querySelector('.buttonPrimary');
let searchForm = document.querySelector('.form');
let searchInput = document.querySelector('input.search');
let result = document.querySelector('.result');

// DOM Element Event handlers

searchForm.addEventListener('submit', function(e) {
	e.preventDefault();
	let request = new XMLHttpRequest();
	request.open('GET', url);
	request.responseType = 'json';
	request.onload = function() {
		forecastWeather = request.response;
		console.log(forecastWeather);
		updateDisplay();
		result.textContent = JSON.stringify(forecastWeather);
	};
	request.send();
});

searchInput.addEventListener('input', function(e) {
	cityId = e.target.value.trim();
	url = apiUrl + '/forecast?q=' + cityId + '&units=metric&APPID=' + API_KEY;
});

document.addEventListener('DOMContentLoaded', function(){
	navigator.geolocation.getCurrentPosition(function(position){
		console.log(position);

		let locationUrl = apiUrl + 'weather?lat=' + 
			position.coords.latitude + 
			'&lon='+ position.coords.longitude + 
			'&units=' + units + '&APPID=' + API_KEY;

		let request = new XMLHttpRequest();
		request.open('GET', locationUrl);
		request.responseType = 'json';
		request.onload = function() {
			currentWeather = request.response;
			console.log(currentWeather);
			//initialize();
			weatherWrapper = document.createElement('div');
			weatherWrapper.className = 'weatherWrapper';
			darkWeatherHourly.appendChild(weatherWrapper);
			updateCurrent(currentWeather);
		};
		request.send();
	});
});

window.onresize = function(event) {
	updateCurrent(currentWeather);
}

function updateDisplay() {
	if(weatherWrapper !== undefined) {
		while(weatherWrapper.firstChild) {
			weatherWrapper.removeChild(weatherWrapper.firstChild);
		}
	} else {
		if(weatherWrapper !== undefined) {
			weatherWrapper = document.createElement('div');
			weatherWrapper.className = 'weatherWrapper';
			darkWeatherHourly.appendChild(weatherWrapper);
		}
	}
	
	//updateCurrent(currentWeather);
	updateForecast(forecastWeather);
}

function updateCurrent(currentWeather){
	var old = document.querySelector('.current');
	if(old) {
		old.parentNode.removeChild(old);
	}
	var weather = currentWeather;
	var current = document.createElement('div');
	current.className = 'current';
	var currentHeader = document.createElement('h4');
	currentHeader.classList = ['currentHeader', 'clearfix'].join(' ');
	var	currentDate = new Date();
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
	humidity.appendChild(document.createTextNode(currentWeather.main.humidity));
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

	weatherWrapper.appendChild(current);
}

function updateForecast(forecastWeather){
	
}

function wiIconClass(type, value) {
	return ['wi', 'wi-day-sleet-storm'];
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
	let calculatedText = "";
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
	calculatedClass += "from-" + Math.round(angle) + "-deg";
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
			calculatedImageUrl += "day-cloudy.jpg";
			break;
		case '02n':
			calculatedImageUrl += "night-cloudy.jpg";
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



