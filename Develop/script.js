let url1 = "https://api.openweathermap.org/data/2.5/forecast?q=";
let url2 = "&APPID=221bd2b65dc4360d11e6b480134dc909";
//Local Storage (previous history if exists)
function init(){
    setHistoryButtons();
    if(localStorage.history){
        let temp = JSON.parse(localStorage.history);
        if(temp.length !== 0){
            $("#main-jumbo").html(``);
            setForecast(temp[0]);
        }
    }
}
init();
//Adding and Updating History
function historyUpdate(input){
    if(!localStorage.history){
        localStorage.history = JSON.stringify([]);
    }
    let temp = JSON.parse(localStorage.history);
    if(temp.length === 8){
        temp.pop();
    }
    if(temp.indexOf(input) !== -1){
        return;
    }
    temp.unshift(input);
    localStorage.history = JSON.stringify(temp);
    setHistoryButtons();
}
//Resetting history buttons
function setHistoryButtons(){
    if(!localStorage.history){
        return;
    }
    let temp = JSON.parse(localStorage.history);
    $(".history-container").html(``);
    temp.forEach(element => {
        $(".history-container").append(`<button type="button" class="btn btn-primary history-button" data-city="${element}">${element}</button>`);
    })
}
//Using Jquery - AJAX Method
function setForecast(input){
    let queryUrl = url1 + input + url2;
    $.ajax({
        url: queryUrl,
        method: "GET",
        error: function(){errorResponse(input)}
    }).then(function(response) {
        //Latitudes and Longitudes
        let lat = parseInt(response.city.coord.lat).toFixed(2);
        let lon = parseInt(response.city.coord.lon).toFixed(2);
        let uviUrl = "https://api.openweathermap.org/data/2.5/uvi?APPID=221bd2b65dc4360d11e6b480134dc909&lat=" + lat + "&lon=" + lon;
        //Convert Kelvin to Fahrenheit
        let fahren = (parseInt(response.list[0].main.temp) - 273.15) * (9/5) + 32;
        fahren = fahren.toFixed(0);
        //Display updated current weather on main jumbotron
        $("#main-jumbo").html(`
        <h1 class="display-8">${response.city.name} (${moment().format("l")})
        <img src="https://openweathermap.org/img/w/${response.list[0].weather[0].icon}.png" alt="${response.list[0].weather[0].description}"></h1>
        <p>Temperature: ${fahren} °F</p>
        <p>Humidity: ${response.list[0].main.humidity}%</p>
        <p>Wind Speed: ${response.list[0].wind.speed} MPH</p>
        <p id="uv-index"></p>
        `);
        //Remaining weather updates
        for(let i = 7, cardIndex = 0; i < parseInt(response.cnt); i += 8, cardIndex++){
            let $tempCard = $($("#forecast").children()[cardIndex]);
            fahren = (parseInt(response.list[i].main.temp) - 273.15) * (9/5) + 32;
            fahren = fahren.toFixed(2);
            $tempCard.html(`
            <h5 style="color: white;">${moment().add((cardIndex + 1), 'days').format('l')}</h5>
            <p><img src="https://openweathermap.org/img/w/${response.list[i].weather[0].icon}.png" alt=
            ${response.list[i].weather[0].description}"></p>
            <p class="forecast-card">Temperature: ${fahren} °F</p>
            <p class="forecast-card">Humidity: ${response.list[i].main.humidity}%</p>
            `);
        }
        //Forecast Title
        $("#forecast-title").html(`<h3>5-Day Forecast:</h3>`);
        //UV Index 
        $.ajax({
            url: uviUrl,
            method: "GET"
        }).then(function(response) {
            let uvi = parseFloat(response.value);
            let severity = "favorable";
            if(uvi > 6){
                severity = "severe";
            }
            else if(uvi > 3){
                severity = "moderate";
            }
            $("#uv-index").html(`uv index: <span class="${severity}">${uvi}</span>`);
        });
    });
}
//Creating a function if valid city is not entered
function errorResponse(input){
    //Also erasing the wrongly entered search from history
    let temp = JSON.parse(localStorage.history);
    temp.splice(temp.indexOf(input), 1);
    localStorage.history = JSON.stringify(temp);
    //Resetting history buttons
    setHistoryButtons();
    //Displaying error message on main jumbotron
    $("#main-jumbo").html(`
    <h1 class="display-8">The city you searched did not give a result. Correct your search and try again.</h1>
    `);
    $("#forecast-title").html(``);
    //Emptying forecast cards
    for(let cardIndex = 0; cardIndex < 5; cardIndex++){
        let $tempCard = $($("#forecast").children()[cardIndex]);
        $tempCard.html(``);
    }
}
function searchHandler(){
    let city = $(".input-text").val();
    $(".input-text").val("");
    if(city.trim() !== ""){
        historyUpdate(city);
        setForecast(city);
    }
}
//Search handler button
$("#search-button").on("click", searchHandler);
//History container button
$(".history-container").on("click", function(event) {
    let $element = $(event.target);
    if($element.hasClass("history-button")){
        setForecast($element.text());
    }
});