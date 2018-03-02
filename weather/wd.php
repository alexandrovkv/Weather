<?php

ini_set('user_agent', $_SERVER["HTTP_USER_AGENT"]);

date_default_timezone_set(date_default_timezone_get());

$time = $_SERVER['REQUEST_TIME'];
$remote_addr = $_SERVER['REMOTE_ADDR'];
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];


switch($request_method) {
case 'GET':
    $request = &$_GET;
    break;
default:
    header("HTTP/1.1 405 method not allowed");
    exit(1);
}


$weatherProviders = array(
    "openweathermap" => array(
	"apiUrl" => "http://api.openweathermap.org/data/2.5/weather",
	"apiKey" => "APIKEY"
    ),
    "worldmeteorologicalorganization" => array(
	"apiUrl" => "http://api.apixu.com/v1/current.json",
	"apiKey" => "APIKEY"
    ),
    "wunderground" => array(
	"apiUrl" => "http://api.wunderground.com/api",
	"apiKey" => "APIKEY"
    ),
    "darksky" => array(
	"apiUrl" => "https://api.darksky.net/forecast",
	"apiKey" => "APIKEY"
    ),
    "weatherbit" => array(
	"apiUrl" => "https://api.weatherbit.io/v2.0/current",
	"apiKey" => "APIKEY"
    ),
    "worldweatheronline" => array(
	"apiUrl" => "https://api.worldweatheronline.com/premium/v1/weather.ashx",
	"apiKey" => "APIKEY"
    )
);

$geoCodeUrl = "http://nominatim.openstreetmap.org";
$geoCodeReverseUrl = $geoCodeUrl . "/reverse";


$provider = $request["provider"];
if(!isset($provider)) {
    header("HTTP/1.1 400 bad request (missing provider)");
    exit(1);
}

$latitude = $request["lat"];
$longitude = $request["lon"];
$units = $request["units"];
$lang = $request["lang"];

$provider = strtolower($provider);

switch($provider) {
case "openweathermap":
    $url = $weatherProviders[$provider]["apiUrl"] . "?" .
           "lat=" . $latitude .
	         "&lon=" . $longitude .
	         "&units=" . $units .
	         "&lang=" . $lang .
	         "&APPID=" . $weatherProviders[$provider]["apiKey"];
    break;
case "worldmeteorologicalorganization":
    $url = $weatherProviders[$provider]["apiUrl"] . "?" .
           "q=" . $latitude . "," . $longitude .
	         "&lang=" . $lang .
	         "&key=" . $weatherProviders[$provider]["apiKey"];
    break;
case "wunderground":
    $url = $weatherProviders[$provider]["apiUrl"] . "/" .
    	     $weatherProviders[$provider]["apiKey"] . "/" .
	         "conditions/q/" .
           $latitude . "," . $longitude . ".json";
    break;
case "darksky":
    $url = $weatherProviders[$provider]["apiUrl"] . "/" .
    	   $weatherProviders[$provider]["apiKey"] . "/" .
           $latitude . "," . $longitude . "?" .
	         "units=" . ($units == "metric" ? "si" : "us") .
	         "&exclude=minutely,hourly,daily,alerts,flags";
    break;
case "weatherbit":
    $url = $weatherProviders[$provider]["apiUrl"] . "?" .
           "lat=" . $latitude .
	          "&lon=" . $longitude .
	          "&lang=" . $lang .
	          "&units=" . ($units == "metric" ? "M" : "I") .
	          "&key=" . $weatherProviders[$provider]["apiKey"];
    break;
case "worldweatheronline":
    $url = $weatherProviders[$provider]["apiUrl"] . "?" .
           "q=" . $latitude . "," . $longitude .
	         "&includelocation=yes" .
	         "&format=json" .
	         "&lang=" . $lang .
	         "&key=" . $weatherProviders[$provider]["apiKey"];
    break;
case "geocode":
    $url = $geoCodeUrl . "?" .
           "format=jsonv2" .
	         "&q=" . $request["q"];
    break;
case "geocodereverse":
    $url = $geoCodeReverseUrl . "?" .
           "format=jsonv2" .
           "&addressdetails=1" .
           "&zoom=18" .
	         "&lat=" . $latitude .
	         "&lon=" . $longitude;
    break;
default:
    header("HTTP/1.1 400 bad request (unknown provider $provider)");
    exit(1);
}

$response = file_get_contents($url);
if(!$response) {
    header($http_response_header[0]);
    exit(1);
}

header('Content-Type: application/json');

echo $response;

exit(0);


?>
