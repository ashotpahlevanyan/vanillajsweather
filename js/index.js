let API_KEY = "468f937be26c4d91fe63cc0f4b7c0c12";
let apiUrl = "http://api.openweathermap.org/data/2.5/";
let cityId = 616051;
let url = apiUrl + '/forecast?id=' + cityId + '&units=metric&APPID=' + API_KEY;

var buttonPrimary = document.querySelector('.buttonPrimary');
var searchForm = document.querySelector('.form');
var searchInput = document.querySelector('input.search');
var result = document.querySelector('.result');

searchForm.addEventListener('submit', function(e) {
	e.preventDefault();
	console.log('form submitted with value ' + searchInput.value.trim());

	var request = new XMLHttpRequest();
	request.open('GET', url);
	request.responseType = 'json';
	request.onload = function() {
	  result.textContent = JSON.stringify(request.response);
	};
	request.send();
});

searchInput.addEventListener('change', function(e) {
	cityId = e.target.value.trim();
});


buttonPrimary.addEventListener('click', function(){
	console.log('button clicked');
});

var weatherData;





function updateDisplay() {

}