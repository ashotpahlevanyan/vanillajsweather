let API_KEY = "468f937be26c4d91fe63cc0f4b7c0c12";
let apiUrl = "http://api.openweathermap.org/data/2.5/";
let cityId = 'Washington';
//let url = apiUrl + '/forecast?id=' + cityId + '&units=metric&APPID=' + API_KEY;
let url;

let buttonPrimary = document.querySelector('.buttonPrimary');
let searchForm = document.querySelector('.form');
let searchInput = document.querySelector('input.search');
let result = document.querySelector('.result');

searchForm.addEventListener('submit', function(e) {
	e.preventDefault();
	console.log('form submitted with value ' + searchInput.value.trim());

	let request = new XMLHttpRequest();
	request.open('GET', url);
	request.responseType = 'json';
	request.onload = function() {
		result.textContent = JSON.stringify(request.response);
	};
	request.send();
});

searchInput.addEventListener('input', function(e) {
	cityId = e.target.value.trim();
	url = apiUrl + '/forecast?q=' + cityId + '&units=metric&APPID=' + API_KEY;
});


buttonPrimary.addEventListener('click', function(){
	console.log('button clicked');
});

let weatherData;

let cities;

document.addEventListener('DOMContentLoaded', function(){
	let request = new XMLHttpRequest();
	request.open('GET', '../data/city.list.json');
	request.responseType = 'json';
	request.onload = function() {
		console.log('Hello');
	  cities = request.response;
	  console.log(cities[35687]);
	};
	request.send();
});


function updateDisplay() {

}