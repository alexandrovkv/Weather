/*
 * Weather JS
 */



weather = {
    urlParams:          null,
    currentProvider:    null,
    wdUrl:              'wd.php',
    osmUrl:             '//openstreetmap.org/#map=16',
    units:              'metric',
    lang:               'ru',
    currentYear:        null,
    currentDay:         null,
    timer:              null,
    seasons:            null,
    season:             {},
    notifySound:        null,
    windSound:          null,
    rainSound:          null,
    thunderSound:       null,
    nightSound:         null,
    lastUpdate:         null,
    interval:           15 * 60 * 1000,
    srTimer:            null,
    snTimer:            null,
    ssTimer:            null,
    ndTimer:            null,
    mrTimer:            null,
    msTimer:            null,

    notify:          null,
    locName:         null,
    locCoords:       null,
    seasonIcon:      null,
    dtIcon:          null,
    dtVal:           null,
    icon:            null,
    description:     null,
    temperature:     null,
    temperatureIcon: null,
    windIcon:        null,
    beaufortIcon:    null,
    windVal:         null,
    pressure:        null,
    humidity:        null,
    clouds:          null,
    sunRise:         null,
    sunSet:          null,
    moonPhase:       null,
    moonDist:        null,
    moonRise:        null,
    moonSet:         null,
    lastUp:          null,
    wdProvider:      null,


    init: function() {
	var me = this;
	var now = new Date();
	var provider = 'owm';
	const weatherProviders = {
	    owm: {
		name:        'OpenWeatherMap',
		description: 'Open Weather Map',
		siteUrl:     'http://openweathermap.org',
		handler:     this.parseOwmData
	    },
	    wmo: {
		name:        'WorldMeteorologicalOrganization',
		description: 'World Meteorological Organization',
		siteUrl:     'https://www.wmo.int',
		handler:     this.parseWmoData
	    },
	    wu: {
		name:        'WUnderground',
		description: 'Weather Underground',
		siteUrl:     'http://www.wunderground.com',
		handler:     this.parseWuData
	    },
	    ds: {
		name:        'DarkSky',
		description: 'Dark Sky',
		siteUrl:     'https://darksky.net/poweredby/',
		handler:     this.parseDsData
	    },
	    wb: {
		name:        'WeatherBit',
		description: 'Weather Bit',
		siteUrl:     'https://www.weatherbit.io/',
		handler:     this.parseWbData
	    },
	    wwo: {
		name:        'WorldWeatherOnline',
		description: 'World Weather Online',
		siteUrl:     'https://www.worldweatheronline.com',
		handler:     this.parseWwoData
	    }
	};

	this.urlParams = new URLSearchParams(window.location.search);

	if(this.urlParams.has('provider'))
	    provider = this.urlParams.get('provider').toLowerCase();
	if(this.urlParams.has('units'))
	    this.units = this.urlParams.get('units');
	if(this.urlParams.has('lang'))
	    this.lang = this.urlParams.get('lang');

	this.currentYear = now.getFullYear();
	this.currentProvider = weatherProviders[provider];

	if(!this.currentProvider) {
	    console.error('unknown weather provider:', provider);
	    return;
	}

	if("geolocation" in navigator) {
	    navigator.geolocation.watchPosition(function(position) {
		me.positionFound.call(me, position);
	    }, function(error) {
		me.positionError.call(me, error);
	    }, {
		enableHighAccuracy: true,
		maximumAge:         60 * 1000,
		timeout:            27 * 1000
	    });
	} else {
            console.error('geolocation not supported');
	}

	this.notify = document.getElementById('notify');
	this.locName = document.getElementById('locName');
	this.locCoords = document.getElementById('locCoords');
	this.seasonIcon = document.getElementById('seasonIcon');
	this.dtIcon = document.getElementById('dtIcon');
	this.dtVal = document.getElementById('dtVal');
	this.icon = document.getElementById('icon');
	this.description = document.getElementById('description');
	this.temperature = document.getElementById('weather-temp');
	this.temperatureIcon = document.getElementById('temperature-icon');
	this.windIcon = document.getElementById('weather-wind-icon');
	this.beaufortIcon = document.getElementById('weather-wind-beaufort-icon');
	this.windVal = document.getElementById('weather-wind-val');
	this.pressure = document.getElementById('weather-bar');
	this.humidity = document.getElementById('weather-hum');
	this.clouds = document.getElementById('weather-clouds');
	this.sunRise = document.getElementById('astr-sunrise');
	this.sunSet = document.getElementById('astr-sunset');
	this.moonPhase = document.getElementById('astr-moonphase');
	this.moonDist = document.getElementById('astr-moondist');
	this.moonRise = document.getElementById('astr-moonrise');
	this.moonSet = document.getElementById('astr-moonset');
	this.lastUp = document.getElementById('weather-last-update');
	this.wdProvider = document.getElementById('weather-provider');

	this.wdProvider.href = this.currentProvider.siteUrl;
	this.wdProvider.innerHTML = this.currentProvider.name;
	this.wdProvider.title = this.currentProvider.description;

	this.updateClock();
	this.initSounds();
    },

    initSounds: function() {
	if(!this.notifySound) {
	    this.notifySound = document.createElement('audio');
	    this.notifySound.src = 'media/sounds/notify.ogg';
	}
    },

    updateClock: function() {
	var now = new Date();

	this.dtVal.innerHTML = now.format('dd-mm-yyyy HH:MM:ss');

	if(!this.timer) {
	    var me = this;

	    this.timer = window.setInterval(function() {
		me.updateClock.call(me);
	    }, 1000);
	}
    },

    positionFound: function(position) {
	var now = new Date();
	var coords = position.coords;

	this.updateAstrData(now, coords);

	if(!this.lastUpdate) {
	    this.lastUpdate = now;
	    this.getWeatherData(coords);
	    return;
	}

	var diff = now.getTime() - this.lastUpdate.getTime();

	if(diff > this.interval) {
	    this.lastUpdate = now;
	    this.getWeatherData(coords);
	}
    },

    positionError: function(error) {
        console.error(error);
    },

    updateAstrData: function(now, coords) {
	var sunTimes = SunCalc.getTimes(now, coords.latitude, coords.longitude);
	var sunPos = SunCalc.getPosition(now, coords.latitude, coords.longitude);
	var moonTimes = SunCalc.getMoonTimes(now, coords.latitude, coords.longitude);
	var moonPos = SunCalc.getMoonPosition(now, coords.latitude, coords.longitude);
	var moonIllumination = SunCalc.getMoonIllumination(now);

	var moonPhaseClassName = this.getMoonPhaseName(moonIllumination.phase, false);
	var sunAlt = Math.round(sunPos.altitude * 180 / Math.PI);
	var sunAz = Math.round(sunPos.azimuth * 180 / Math.PI) - 180;
	var moonAlt = Math.round(moonPos.altitude * 180 / Math.PI);
	var moonAz = Math.round(moonPos.azimuth * 180 / Math.PI) - 180;
	const sunPhase = {
	    rise: {
		ru:  'Восход',
		en:  'Sun Rise'
	    },
	    day: {
		ru:  'день',
		en:  'day'
	    },
	    set: {
		ru:  'Закат',
		en:  'Sun Set'
	    },
	    night: {
		ru:  'ночь',
		en:  'night'
	    }
	};
	const ispolarday = {
	    true: {
		ru:  'полярный день',
		en:  'polar day'
	    },
	    false: {
		ru:  'полярная ночь',
		en:  'polar night'
	    }
	};
	const moonPosDesc = {
	    'alwaysUp': {
		ru:  'над горизонтом',
		en:  'above horizon'
	    },
	    'alwaysDown': {
		ru:  'под горизонтом',
		en:  'below horizon'
	    }
	};

	if(sunAz < 0)
	    sunAz += 360;
	if(moonAz < 0)
	    moonAz += 360;

	this.updateSeason(now, coords.latitude);
	this.setupNotifications(now, sunTimes, moonTimes);
	this.updateTimeline(now, sunTimes);
	//this.night(!isDay);

	var isPolarDay = (now >= this.seasons[0] && now < this.seasons[2]);
	if(coords.latitude < 0)
	    isPolarDay = !isPolarDay;

	this.dtVal.title = 'Sun position: altitude: ' + sunAlt + '\u00B0' +
	    ', azimuth: ' + sunAz + '\u00B0 (' + this.degToCompass(sunAz) + ')';

	if(now >= sunTimes.sunrise && now < sunTimes.sunriseEnd) {
	    this.dtIcon.className = 'wi wi-sunrise';
	    this.dtIcon.title = sunPhase['rise'][this.lang];
	} else if(now >= sunTimes.sunriseEnd && now < sunTimes.sunsetStart) {
	    this.dtIcon.className = 'wi wi-day-sunny';
	    this.dtIcon.title = sunPhase['day'][this.lang];
	} else if(now >= sunTimes.sunsetStart && now < sunTimes.sunset) {
	    this.dtIcon.className = 'wi wi-sunset';
	    this.dtIcon.title = sunPhase['set'][this.lang];
	} else {
	    this.dtIcon.className = 'wi wi-night-clear';
	    this.dtIcon.title = sunPhase['night'][this.lang];
	}
	
	if(isNaN(sunTimes.sunrise.getTime())) {
	    this.dtIcon.className = 'wi ' + (isPolarDay ? 'wi-day-sunny' : 'wi-night-clear');
	    this.dtIcon.title = ispolarday[isPolarDay][this.lang];
	    this.sunRise.innerHTML = '--:--';
	    this.sunRise.title = ispolarday[isPolarDay][this.lang];
	} else {
	    this.sunRise.innerHTML = sunTimes.sunrise.format('HH:MM');
	    this.sunRise.title = sunTimes.sunrise.format('HH:MM:ss');
	}

	if(isNaN(sunTimes.sunset.getTime())) {
	    this.dtIcon.className = 'wi ' + (isPolarDay ? 'wi-day-sunny' : 'wi-night-clear');
	    this.dtIcon.title = ispolarday[isPolarDay][this.lang];
	    this.sunSet.innerHTML = '--:--';
	    this.sunSet.title = ispolarday[isPolarDay][this.lang];
	} else {
	    this.sunSet.innerHTML = sunTimes.sunset.format('HH:MM');
	    this.sunSet.title = sunTimes.sunset.format('HH:MM:ss');
	}

	this.moonPhase.className = 'wi ' + moonPhaseClassName;
	this.moonPhase.title = Math.round(moonIllumination.phase * 100) + '%';
	this.moonDist.innerHTML = ' ' + Math.round(moonPos.distance) +
	                          (this.lang === 'ru' ? ' км' : ' km');

	this.moonDist.title = 'altitude: ' + moonAlt + '\u00B0' +
	                      ", azimuth: " + moonAz + '\u00B0  (' +
	                      this.degToCompass(moonAz) + ')';

	if('rise' in moonTimes) {
	    this.moonRise.innerHTML = moonTimes.rise.format('HH:MM');
	    this.moonRise.title = moonTimes.rise.format('HH:MM:ss');
	} else {
	    this.moonRise.innerHTML = '--:--';
	    if('set' in moonTimes) {
		this.moonRise.title = moonPosDesc['alwaysDown'][this.lang];
	    } else {
		this.moonRise.title = moonPosDesc[Object.keys(moonTimes)[0]][this.lang];
	    }
	}

	if('set' in moonTimes) {
	    this.moonSet.innerHTML = moonTimes.set.format('HH:MM');
	    this.moonSet.title = moonTimes.set.format('HH:MM:ss');
	} else {
	    this.moonSet.innerHTML = '--:--';
	    if('rise' in moonTimes) {
		this.moonSet.title = moonPosDesc['alwaysUp'][this.lang];
	    } else {
		this.moonSet.title = moonPosDesc[Object.keys(moonTimes)[0]][this.lang];
	    }
	}
    },

    updateSeason: function(now, latitude) {
	var year = now.getFullYear();
	const winter = {
	    ru:  'зима',
	    en:  'winter'
	}, spring = {
	    ru:  'весна',
	    en:  'spring'
	}, summer = {
	    ru:  'лето',
	    en:  'summer'
	}, autumn = {
	    ru:  'осень',
	    en:  'autumn'
	};
	var season;

	if(!this.seasons || year != this.currentYear) {
	    this.currentYear = year;
	    this.seasons = Date.getSeasons(year);
	    this.seasons.shift();
	}

	if(now < this.seasons[0] || now >= this.seasons[3])
	    season = latitude < 0 ? summer : winter;
	else if(now >= this.seasons[0] && now < this.seasons[1])
	    season = latitude < 0 ? autumn : spring;
	else if(now >= this.seasons[1] && now < this.seasons[2])
	    season = latitude < 0 ? winter : summer;
	else if(now >= this.seasons[2] && now < this.seasons[3])
	    season = latitude < 0 ? spring : autumn;

	if(season.en !== this.season.en) {
	    this.season = season;
	    this.seasonIcon.src = 'media/images/' + this.season.en + '.png';
	    this.seasonIcon.title = this.season[this.lang];
	    console.debug(now.format('dd-mm-yyyy HH:MM:ss'), 'update season');

	    this.seasons.forEach(function(s, i) {
		console.debug(i, s.format('dd-mm-yyyy HH:MM:ss'));
	    });
	}
    },

    setupNotifications: function(now, sunTimes, moonTimes) {
	var me = this;
	const notificationMessage = {
	    sunRise: {
		ru:  'Восход солнца',
		en:  'Sun rise'
	    },
	    solarNoon: {
		ru:  'Полдень',
		en:  'Solar noon'
	    },
	    sunSet: {
		ru:  'Закат солнца',
		en:  'Sun set'
	    },
	    midnight: {
		ru:  'Полночь',
		en:  'Midnight'
	    },
	    moonRise: {
		ru:  'Восход луны',
		en:  'Moon rise'
	    },
	    moonSet: {
		ru:  'Закат луны',
		en:  'Moon set'
	    },
	};

	if(!isNaN(sunTimes.sunrise.getTime()) &&
	   (now < sunTimes.sunrise)) {
	    if(!this.srTimer) {
		var interval = Math.round(sunTimes.sunrise.getTime() - now.getTime());
		console.debug('set sun rise timer:', interval, 'ms');

		this.srTimer = window.setTimeout(function() {
		    me.srTimer = null;
		    me.showNotify(notificationMessage.sunRise[me.lang]);
		}, interval);
	    }
	}

	if(!isNaN(sunTimes.solarNoon.getTime()) &&
	   (now < sunTimes.solarNoon)) {
	    if(!this.snTimer) {
		var interval = Math.round(sunTimes.solarNoon.getTime() - now.getTime());
		console.debug('set solar noon timer:', interval, 'ms -',
			      sunTimes.solarNoon.format('HH:MM:ss'));

		this.snTimer = window.setTimeout(function() {
		    me.snTimer = null;
		    me.showNotify(notificationMessage.solarNoon[me.lang]);
		}, interval);
	    }
	}

	if(!isNaN(sunTimes.sunset.getTime()) &&
	   (now < sunTimes.sunset)) {
	    if(!this.ssTimer) {
		var interval = Math.round(sunTimes.sunset.getTime() - now.getTime());
		console.debug('set sun set timer:', interval, 'ms');

		this.ssTimer = window.setTimeout(function() {
		    me.ssTimer = null;
		    me.showNotify(notificationMessage.sunSet[me.lang]);
		}, interval);
	    }
	}

	if(!isNaN(sunTimes.nadir.getTime()) &&
	   (now < sunTimes.nadir)) {
	    if(!this.ndTimer) {
		var interval = Math.round(sunTimes.nadir.getTime() - now.getTime());
		console.debug('set midnight timer:', interval, 'ms -',
			      sunTimes.nadir.format('HH:MM:ss'));

		this.ndTimer = window.setTimeout(function() {
		    me.ndTimer = null;
		    me.showNotify(notificationMessage.midnight[me.lang]);
		}, interval);
	    }
	}

	if('rise' in moonTimes &&
	   (now < moonTimes.rise)) {
	    if(!this.mrTimer) {
		var interval = Math.round(moonTimes.rise.getTime() - now.getTime());
		console.debug('set moon rise timer:', interval, 'ms');

		this.mrTimer = window.setTimeout(function() {
		    me.mrTimer = null;
		    me.showNotify(notificationMessage.moonRise[me.lang]);
		}, interval);
	    }
	}

	if('set' in moonTimes &&
	   (now < moonTimes.set)) {
	    if(!this.msTimer) {
		var interval = Math.round(moonTimes.set.getTime() - now.getTime());
		console.debug('set moon set timer:', interval, 'ms');

		this.msTimer = window.setTimeout(function() {
		    me.msTimer = null;
		    me.showNotify(notificationMessage.moonSet[me.lang]);
		}, interval);
	    }
	}
    },

    updateTimeline: function(now, sunTimes) {
	if(!this.currentDay || (this.currentDay != now.getDate())) {
	    this.currentDay = now.getDate();
	    console.debug(now.format('dd-mm-yyyy HH:MM:ss'), 'update timeline');

	    var timeLine = document.getElementById('timeline');
	    var astrTwl = document.getElementById('astr-twl');
	    var nautTwl = document.getElementById('naut-twl');
	    var civilTwl = document.getElementById('civil-twl');
	    var day = document.getElementById('day');
	    var cursor = document.getElementById('cursor');

	    const title = {
		night: {
		    ru: 'Ночь',
		    en: 'Night'
		},
		astr: {
		    ru: 'Астрономические сумерки',
		    en: 'Astronomical twilight'
		},
		naut: {
		    ru: 'Навигационные сумерки',
		    en: 'Nautical twilight'
		},
		civil: {
		    ru: 'Гражданские сумерки',
		    en: 'Civil twilight'
		},
		day: {
		    ru: 'День',
		    en: 'Day'
		}
	    };


	    var astrTwlLength = (sunTimes.night.getTime() - sunTimes.nightEnd.getTime()) / 1000;
	    if(isNaN(astrTwlLength))
		astrTwlLength = 60 * 60 * 24;

	    var nautTwlLength = (sunTimes.nauticalDusk.getTime() - sunTimes.nauticalDawn.getTime()) / 1000;
	    if(isNaN(nautTwlLength))
		nautTwlLength = 60 * 60 * 24;

	    var civilTwlLength = (sunTimes.dusk.getTime() - sunTimes.dawn.getTime()) / 1000;
	    if(isNaN(civilTwlLength))
		civilTwlLength = 60 * 60 * 24;

	    var dayLength = (sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / 1000;
	    if(isNaN(dayLength))
		dayLength = 60 * 60 * 24;

	    var curPos = (now.getTime() - sunTimes.nadir.getTime()) / 1000;

	    timeLine.title = title.night[this.lang];
	    astrTwl.title = title.astr[this.lang];
	    nautTwl.title = title.naut[this.lang];
	    civilTwl.title = title.civil[this.lang];
	    day.title = title.day[this.lang];

	    astrTwl.style.width = astrTwlLength / 864 + '%';
	    nautTwl.style.width = nautTwlLength / 864 + '%';
	    civilTwl.style.width = civilTwlLength / 864 + '%';
	    day.style.width = dayLength / 864 + '%';
	    cursor.style.left = curPos / 864 + '%';
	    cursor.style.animation = 'moveCursor ' + (86400 - curPos) + 's linear';
	    cursor.onanimationend = function(e) {
		if(e.animationName === 'moveCursor') {
		    cursor.style.left = 0;
		    cursor.style.animation = 'moveCursor 86400s linear infinite';
		}
	    };
	}
    },

    getWeatherData: function(coords) {
	var url = this.wdUrl + '?' +
	    'provider=' + this.currentProvider.name +
	    '&lat=' + coords.latitude +
	    '&lon=' + coords.longitude +
	    '&units=' + this.units +
	    '&lang=' + this.lang;

	this.clearWeatherData();
	this.sendRequest(url, this.processWeatherData, this);
    },

    clearWeatherData: function() {
	this.locName.innerHTML = '';
	this.locName.title = '';
	this.locCoords.href = '';
	this.locCoords.innerHTML = '';

	this.icon.className = 'wi wi-refresh';
	this.description.innerHTML = '';

	this.temperature.innerHTML = '';
	this.windIcon.className = 'wi wi-wind';
	this.windIcon.title = '';
	this.beaufortIcon.className = 'wi';
	this.beaufortIcon.title = '';
	this.windVal.innerHTML = '';
	this.pressure.innerHTML = '';
	this.humidity.innerHTML = '';
	this.clouds.innerHTML = '';
    },

    processWeatherData: function(data) {
        console.debug(data);
	if(!data) {
            console.error('weather: no data');
	    this.icon.className = 'wi wi-na';
            return;
        }

	this.currentProvider.handler.call(this, data);
    },

    parseOwmData: function(data) {
        if(data.cod && data.cod !== 200) {
            console.error('OWM: get weather error:',
			  data.cod, '(' + data.message + ')');
	    this.icon.className = 'wi wi-na';
            return;
        }

	var location = new Location({
	    latitude:     data.coord.lat,
	    longitude:    data.coord.lon,
	    name:         data.name,
	    country:      data.sys.country
	});
	var weather = new Weather({
	    iconClass:    'wi wi-owm-' + data.weather[0].id,
	    description:  data.weather[0].description,
	    temperature:  data.main.temp,
	    windDeg:      data.wind.deg,
	    windSpeed:    data.wind.speed,
	    pressure:     data.main.pressure,
	    humidity:     data.main.humidity,
	    clouds:       data.clouds.all,
	    visibility:   Math.round(data.visibility / 1000)
	});
	var _data = new Data({
	    location:     location,
	    weather:      weather,
	    lastUpdate:   new Date(data.dt * 1000)
	});

	this.updateWeatherData(_data);
    },

    parseWmoData: function(data) {
	var location = data.location;
	var current = data.current;

	const wmo2wi = {
	    113:  'wi-day-sunny',            // Clear/Sunny
	    116:  'wi-cloudy',               // Partly Cloudy
	    119:  'wi-cloudy',               // Cloudy
	    122:  'wi-day-sunny-overcast',   // Overcast
	    143:  'wi-fog',                  // Mist
	    176:  'wi-rain',                 // Patchy rain nearby
	    179:  'wi-snow',                 // Patchy snow nearby
	    182:  'wi-sleet',                // Patchy sleet nearby
	    185:  'wi-snowflake-cold',       // Patchy freezing drizzle nearby
	    200:  'wi-storm-showers',        // Thundery outbreaks in nearby
	    227:  'wi-snow',                 // Blowing snow
	    230:  'wi-snow-wind',            // Blizzard
	    248:  'wi-fog',                  // Fog
	    260:  'wi-fog',                  // Freezing fog
	    263:  'wi-snowflake-cold',       // Patchy light drizzle
	    266:  'wi-snowflake-cold',       // Light drizzle
	    281:  'wi-snowflake-cold',       // Freezing drizzle
	    284:  'wi-snowflake-cold',       // Heavy freezing drizzle
	    293:  'wi-rain',                 // Patchy light rain
	    296:  'wi-rain',                 // Light rain
	    299:  'wi-rain',                // Moderate rain at time
	    302:  'wi-rain',                // Moderate rain
	    305:  'wi-raun',                // Heavy rain at times
	    308:  'wi-rain',                // Heavy rain
	    311:  'wi-rain',                // Light freezing rain
	    314:  'wi-rain',                // Moderate or Heavy freezing rain
	    317:  'wi-sleet',               // Light sleet
	    320:  'wi-sleet',               // Moderate or heavy sleet
	    323:  'wi-snow',                // Patchy light snow
	    326:  'wi-snow',                // Light snow
	    329:  'wi-snow',                // Patchy moderate snow
	    332:  'wi-snow',                // Moderate snow
	    335:  'wi-snow',                // Patchy heavy snow
	    338:  'wi-snow',                // Heavy snow
	    350:  'wi-snowflake-cold',      // Ice pellets
	    353:  'wi-showes',              // Light rain shower
	    356:  'wi-showes',              // Moderate or heavy rain shower
	    359:  'wi-showes',              // Torrential rain shower
	    362:  'wi-showes',              // Light sleet showers
	    365:  'wi-sleet',               // Moderate or heavy sleet
	    368:  'wi-snow',                // Light snow showers
	    371:  'wi-snow',                // Moderate or heavy snow showers
	    374:  'wi-showes',              // Light showers of ice pellets
	    377:  'wi-showes',              // Moderate or heavy showers of ice pellets
	    386:  'wi-thunderstorm',        // Patchy light rain in area with thunder
	    389:  'wi-thunderstorm',        // Moderate or heavy rain in area with thunder
	    392:  'wi-storm-showers',       // Patchy light snow in area with thunder
	    395:  'wi-storm-showers'        // Moderate or heavy snow in area with thunder
	};

	var icon = current.condition.icon;
	var code = icon.substring(icon.lastIndexOf('/') + 1);
	if(code.lastIndexOf(".") != -1)
            code = code.substring(0, code.lastIndexOf('.'));

	var location = new Location({
	    latitude:     location.lat,
	    longitude:    location.lon,
	    name:         location.name,
	    country:      location.country
	});
	var weather = new Weather({
	    iconClass:    'wi ' + wmo2wi[code],
	    description:  current.condition.text,
	    temperature:  this.units === 'metric' ? current.temp_c : current.temp_f,
	    windDeg:      current.wind_degree,
	    windSpeed:    this.units === 'metric' ? (Math.round(current.wind_kph * 10/36)) : current.wind_mph,
	    pressure:     current.pressure_mb,
	    humidity:     current.humidity,
	    clouds:       current.cloud,
	    visibility:   this.units === 'metric' ? current.vis_km : current.vis_miles
	});
	var _data = new Data({
	    location:     location,
	    weather:      weather,
	    lastUpdate:   new Date(current.last_updated_epoch * 1000)
	});

	this.updateWeatherData(_data);
    },

    parseWuData: function(data) {
	var response = data.response;
	var current_observation = data.current_observation;

	if(response.error) {
            console.error('WU: get weather error:',
			  response.error.type,
			  '(' + response.error.description + ')');
	    this.icon.className = 'wi wi-na';
            return;
	}

	var location = new Location({
	    latitude:     current_observation.display_location.latitude,
	    longitude:    current_observation.display_location.longitude,
	    name:         current_observation.display_location.city,
	    country:      current_observation.display_location.country_iso3166
	});
	var weather = new Weather({
	    iconClass:    'wi wi-wu-' + current_observation.icon,
	    description:  current_observation.weather,
	    temperature:  this.units === 'metric' ? current_observation.temp_c : current_observation.temp_f,
	    windDeg:      current_observation.wind_degrees,
	    windSpeed:    this.units === 'metric' ? (Math.round(current_observation.wind_kph * 10/36)) : current_observation.wind_mph,
	    pressure:     current_observation.pressure_mb,
	    humidity:     current_observation.relative_humidity.slice(0, -1),
	    visibility:   parseFloat(this.units === 'metric' ? current_observation.visibility_km : current_observation.visibility_mi)
	});
	var _data = new Data({
	    location:     location,
	    weather:      weather,
	    lastUpdate:   new Date(current_observation.observation_epoch * 1000)
	});

	this.updateWeatherData(_data);
    },

    parseDsData: function(data) {
	var currently = data.currently;

	var location = new Location({
	    latitude:     data.latitude,
	    longitude:    data.longitude
	});
	var weather = new Weather({
	    iconClass:    'wi wi-forecast-io-' + currently.icon,
	    description:  currently.summary,
	    temperature:  currently.temperature,
	    windDeg:      currently.windBearing,
	    windSpeed:    currently.windSpeed,
	    pressure:     currently.pressure,
	    humidity:     Math.round(currently.humidity * 100),
	    clouds:       Math.round(currently.cloudCover * 100),
	    visibility:   currently.visibility
	});
	var _data = new Data({
	    location:     location,
	    weather:      weather,
	    lastUpdate:   new Date(currently.time * 1000)
	});

	this.updateWeatherData(_data);
    },

    parseWbData: function(data) {
	var d = data.data[0];
	var w = d.weather;

	const wb2wi = {
	    // 200 - Thunderstorm with light rain
	    t01d:  'wi-day-thunderstorm',
	    t01n:  'wi-night-alt-thunderstorm',
	    // 201 - Thunderstorm with rain
	    t02d:  'wi-day-thunderstorm',
	    t02n:  'wi-night-alt-thunderstorm',
	    // 202 - Thunderstorm with heavy rain
	    t03d:  'wi-day-thunderstorm',
	    t03n:  'wi-night-alt-thunderstorm',
	    // 230 - Thunderstorm with light drizzle
	    t04d:  'wi-day-sleet-storm',
	    t04n:  'wi-night-alt-sleet-storm',
	    // 231 - Thunderstorm with drizzle
	    t04d:  'wi-day-sleet-storm',
	    t04n:  'wi-night-alt-sleet-storm',
	    // 232 - Thunderstorm with heavy drizzle
	    t04d:  'wi-day-sleet-storm',
	    t04n:  'wi-night-alt-sleet-storm',
	    // 233 - Thunderstorm with Hail
	    t05d:  'wi-day-sleet-storm',
	    t05n:  'wi-night-alt-sleet-storm',
	    // 300 - Light Drizzle
	    d01d:  'wi-day-hail',
	    d01n:  'wi-night-alt-hail',
	    // 301 - Drizzle
	    d02d:  'wi-day-hail',
	    d02n:  'wi-night-alt-hail',
	    // 302 - Heavy Drizzle
	    d03d:  'wi-day-hail',
	    d03n:  'wi-night-alt-hail',
	    // 500 - Light Rain
	    r01d:  'wi-day-rain',
	    r01n:  'wi-night-alt-rain',
	    // 501 - Moderate Rain
	    r02d:  'wi-day-rain',
	    r02n:  'wi-night-alt-rain',
	    // 502 - Heavy Rain
	    r03d:  'wi-day-rain-wind',
	    r03n:  'wi-night-alt-rain-wind',
	    // 511 - Freezing rain
	    f01d:  'wi-day-rain-mix',
	    f01n:  'wi-night-alt-rain-mix',
	    // 520 - Light shower rain
	    r04d:  'wi-day-showers',
	    r04n:  'wi-night-alt-showers',
	    // 521 - Shower rain
	    r05d:  'wi-day-showers',
	    r05n:  'wi-night-alt-showers',
	    // 522 - Heavy shower rain
	    r06d:  'wi-day-showers',
	    r06n:  'wi-night-alt-showers',
	    // 600 - Light snow
	    s01d:  'wi-day-snow',
	    s01n:  'wi-night-alt-snow',
	    // 601 - Snow
	    s02d:  'wi-day-snow',
	    s02n:  'wi-night-alt-snow',
	    // 602 - Heavy Snow
	    s03d:  'wi-day-snow',
	    s03n:  'wi-night-alt-snow',
	    // 610 - Mix snow/rain
	    s04d:  'wi-day-rain-mix',
	    s04n:  'wi-night-alt-rain-mix',
	    // 611 - Sleet
	    s05d:  'wi-day-sleet',
	    s05n:  'wi-night-alt-sleet',
	    // 612 - Heavy sleet
	    s05d:  'wi-day-sleet',
	    s05n:  'wi-night-alt-sleet',
	    // 621 - Snow shower
	    s01d:  'wi-day-showers',
	    s01n:  'wi-night-alt-showers',
	    // 622 - Heavy snow shower
	    s02d:  'wi-day-showers',
	    s02n:  'wi-night-alt-showers',
	    // 623 - Flurries
	    s06d:  'wi-day-showers',
	    s06n:  'wi-night-alt-showers',
	    // 700 - Mist
	    a01d:  'wi-day-fog',
	    a01n:  'wi-night-fog',
	    // 711 - Smoke
	    a02d:  'wi-smoke',
	    a02n:  'wi-smoke',
	    // 721 - Haze
	    a03d:  'wi-day-haze',
	    a03n:  'wi-night-fog',
	    // 731 - Sand/dust
	    a04d:  'wi-dust',
	    a04n:  'wi-dust',
	    // 741 - Fog
	    a05d:  'wi-day-fog',
	    a05n:  'wi-night-fog',
	    // 751 - Freezing Fog
	    a06d:  'wi-night-fog',
	    a06n:  'wi-night-fog',
	    // 800 - Clear sky
	    c01d:  'wi-day-sunny',
	    c01n:  'wi-night-clear',
	    // 801 - Few clouds
	    c02d:  'wi-day-cloudy',
	    c02n:  'wi-night-alt-cloudy',
	    // 802 - Scattered clouds
	    c02d:  'wi-day-cloudy',
	    c02n:  'wi-night-alt-cloudy',
	    // 803 - Broken clouds
	    c03d:  'wi-day-cloudy',
	    c03n:  'wi-night-alt-cloudy',
	    // 804 - Overcast clouds
	    c04d:  'wi-day-sunny-overcast',
	    c04n:  'wi-night-alt-partly-cloudy',
	    // 900 - Unknown Precipitation
	    u00d:  'wi-na',
	    u00n:  'wi-na'
	};

	var location = new Location({
	    latitude:     d.lat,
	    longitude:    d.lon,
	    name:         d.city_name,
	    country:      d.country_code
	});
	var weather = new Weather({
	    iconClass:    'wi ' + wb2wi[w.icon],
	    description:  w.description,
	    temperature:  d.temp,
	    windDeg:      d.wind_dir,
	    windSpeed:    d.wind_spd,
	    pressure:     d.pres,
	    humidity:     d.rh,
	    clouds:       d.clouds,
	    visibility:   d.vis
	});
	var _data = new Data({
	    location:     location,
	    weather:      weather,
	    lastUpdate:   new Date(d.ob_time)
	});

	this.updateWeatherData(_data);
    },

    parseWwoData: function(data) {
	var d = data.data;
	var nearest_area = d.nearest_area[0];
	var current_condition = d.current_condition[0];

	var location = new Location({
	    latitude:     nearest_area.latitude,
	    longitude:    nearest_area.longitude,
	    name:         nearest_area.areaName[0].value,
	    country:      nearest_area.country[0].value
	});
	var weather = new Weather({
	    iconClass:    'wi wi-' + current_condition.weatherCode,
	    description:  current_condition.weatherDesc[0].value,
	    temperature:  this.units === 'metric' ? current_condition.temp_C : current_condition.temp_F,
	    windDeg:      current_condition.winddirDegree,
	    windSpeed:    this.units === 'metric' ? (Math.round(current_condition.windspeedKmph * 10/36)) : current_condition.windspeedMiles,
	    pressure:     current_condition.pressure,
	    humidity:     current_condition.humidity,
	    clouds:       current_condition.cloudcover,
	    visibility:   current_condition.visibility
	});
	var _data = new Data({
	    location:     location,
	    weather:      weather,
	    lastUpdate:   this.parseTime(current_condition.observation_time)
	});

	this.updateWeatherData(_data);
    },

    updateWeatherData: function(data) {
	var location = data.location;
	var weather = data.weather;

	var beaufort = this.getBeaufort(weather.windSpeed);
	console.debug(data);

	this.geoCodeReverse(location, function(result) {
	    console.debug(result);

	    if(!result)
		return;

	    if(!location.name)
		this.locName.innerHTML = result.address.city || result.address.state +
		                         '&nbsp;&nbsp;(' + result.address.country + ')';

	    this.locName.title = result.display_name;
	}, this);
	this.showNotify('Weather data updated');

	this.locName.innerHTML = (location.name ? location.name : '--') +
	                         '&nbsp;&nbsp;(' +
	                         (location.country ? location.country : '--') + ')';
	this.locCoords.href = this.osmUrl + '/' +
	                      location.latitude + '/' +
	                      location.longitude;
	this.locCoords.innerHTML = this.latFormat(location.latitude) +
	                           '&nbsp;&nbsp;&nbsp;' +
	                           this.lngFormat(location.longitude);

	this.icon.className = weather.iconClass;
	this.description.innerHTML = weather.description;

	this.temperature.innerHTML = '&nbsp;' + weather.temperature;
	this.temperatureIcon.className = 'wi ' +
	    (this.units === 'metric' ? 'wi-celsius' : 'wi-fahrenheit');
	this.windIcon.className = 'wi wi-wind ' + 'from-' +
	                          Math.round(weather.windDeg) + '-deg';
	this.windIcon.title = weather.windDeg + '\u00B0  (' +
	                      this.degToCompass(weather.windDeg) + ')';
	this.beaufortIcon.className = 'wi wi-wind-beaufort-' + beaufort.value;
	this.beaufortIcon.title = beaufort.description[this.lang];
	this.windVal.innerHTML = '&nbsp;' + weather.windSpeed +
	                         (this.lang === 'ru' ? ' м/с' : ' m/s');
	this.pressure.innerHTML = '&nbsp;' + Math.round(weather.pressure / 1.33322387415) +
	                          (this.lang === 'ru' ? ' мм&nbsp;рт&nbsp;ст' : ' mm&nbsp;hg');
	this.humidity.innerHTML = '&nbsp;' + weather.humidity + '%';
	this.clouds.innerHTML = weather.clouds === undefined ? '<i class="wi wi-na"></i>' : ('&nbsp;' + weather.clouds + '%');

	this.lastUp.innerHTML = 'Last update:&nbsp;' +
	                        data.lastUpdate.format('dd-mm-yyyy HH:MM:ss');
    },

    getBeaufort: function(speed) {
	var value;
	var description;

	if(speed <= .2) {
	    value = 0;
	    description = {
		ru: 'Штиль',
		en: 'Calm'
	    };
	} else if(speed >= .3 && speed <= 1.5) {
	    value = 1;
	    description = {
		ru: 'Тихий ветер',
		en: 'Light air'
	    };
	} else if(speed >= 1.6 && speed <= 3.3) {
	    value = 2;
	    description = {
		ru: 'Лёгкий ветер',
		en: 'Light breeze'
	    };
	} else if(speed >= 3.4 && speed <= 5.4) {
	    value = 3;
	    description = {
		ru: 'Слабый ветер',
		en: 'Gentle breeze'
	    };
	} else if(speed >= 5.5 && speed <= 7.9) {
	    value = 4;
	    description = {
		ru: 'Умеренный ветер',
		en: 'Moderate breeze'
	    };
	} else if(speed >= 8. && speed <= 10.7) {
	    value = 5;
	    description = {
		ru: 'Свежий ветер',
		en: 'Fresh breeze'
	    };
	} else if(speed >= 10.8 && speed <= 13.8) {
	    value = 6;
	    description = {
		ru: 'Сильный ветер',
		en: 'Strong breeze'
	    };
	} else if(speed >= 13.9 && speed <= 17.1) {
	    value = 7;
	    description = {
		ru: 'Крепкий ветер',
		en: 'High wind, moderate gale, near gale'
	    };
	} else if(speed >= 17.2 && speed <= 20.7) {
	    value = 8;
	    description = {
		ru: 'Очень крепкий ветер',
		en: 'fresh gale'
	    };
	} else if(speed >= 20.8 && speed <= 24.4) {
	    value = 9;
	    description = {
		ru: 'Шторм',
		en: 'Strong/severe gale'
	    };
	} else if(speed >= 24.5 && speed <= 28.4) {
	    value = 10;
	    description = {
		ru: 'Сильный шторм',
		en: 'Storm, whole gale'
	    };
	} else if(speed >= 28.5 && speed <= 32.6) {
	    value = 11;
	    description = {
		ru: 'Жестокий шторм',
		en: 'Violent storm'
	    };
	} else {
	    value = 12;
	    description = {
		ru: 'Ураган',
		en: 'Hurricane force'
	    };
	}

	return {
	    value:        value,
	    description:  description
	};
    },

    getMoonPhaseName: function(phase, alt) {
	const phaseNames = ['new',
			    'waxing-crescent-1', 'waxing-crescent-2',
			    'waxing-crescent-3', 'waxing-crescent-4',
			    'waxing-crescent-5', 'waxing-crescent-6',
			    'first-quarter',
			    'waxing-gibbous-1', 'waxing-gibbous-2',
			    'waxing-gibbous-3', 'waxing-gibbous-4',
			    'waxing-gibbous-5', 'waxing-gibbous-6',
			    'full',
			    'waning-gibbous-1', 'waning-gibbous-2',
			    'waning-gibbous-3', 'waning-gibbous-4',
			    'waning-gibbous-5', 'waning-gibbous-6',
			    'third-quarter',
			    'waning-crescent-1', 'waning-crescent-2',
			    'waning-crescent-3', 'waning-crescent-4',
			    'waning-crescent-5', 'waning-crescent-6'];
	var phaseIndex = Math.round(phase * phaseNames.length) % phaseNames.length;
	var phaseName = 'wi-moon-' + (alt ? 'alt-' : '') + phaseNames[phaseIndex];

	return phaseName;
    },

    geoCode: function(query, callback, scope) {
        var url = this.wdUrl + '?' +
            'provider=geocode' +
            '&q=' + encodeURIComponent(query);

	this.sendRequest(url, callback, scope);
    },

    geoCodeReverse: function(coord, callback, scope) {
        var url = this.wdUrl + '?' +
            'provider=geocodereverse' +
            '&lat=' + coord.latitude +
            '&lon=' + coord.longitude;

	this.sendRequest(url, callback, scope);
    },

    sendRequest: function(url, callback, scope) {
	var xhr = new XMLHttpRequest();

        xhr.onload = function() {
            if(this.status >= 200 && this.status < 300) {
                var json = null;

                try {
                    json = JSON.parse(this.response);
                } catch (e) {
                    console.error(e);
                }

                callback && callback.call(scope, json);
            } else {
                console.error(this.status + ':', this.statusText);
                callback && callback.call(scope, null);
	    }
        };
	xhr.onerror = function() {
            console.error(this.status + ':', this.statusText);
            callback && callback.call(scope, null);
	};
	xhr.ontimeout = function() {
            console.error('request timed out');
            callback && callback.call(scope, null);
	};
	xhr.onabort = function() {
            console.error('request aborted');
            callback && callback.call(scope, null);
	};

        xhr.open('GET', url, true);
        xhr.send(null);
    },

    toQueryString: function(obj) {
	var arr = [];

	for(var key in obj) {
	    if(obj.hasOwnProperty(key)) {
		var str = encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);

		arr.push(str);
	    }
	}

	return arr.join('&');
    },

    showNotify: function(message) {
	if(this.notify) {
	    var me = this;

	    this.notify.innerHTML = message;
	    this.notify.classList.add('show');
	    this.notifySound.play();

	    window.setTimeout(function() {
		me.notify.innerHTML = '';
		me.notify.classList.remove('show');
	    }, 3000);
	}
    },

    latFormat: function(latitude) {
        var hemi = latitude >= 0 ? 'N ' : 'S ';
        var dms = this.dd2dms(latitude);

        return hemi + dms;
    },
    lngFormat: function(longitude) {
        var hemi = longitude >= 0 ? 'E ' : 'W ';
        var dms = this.dd2dms(longitude);

        return hemi + dms;
    },
    dd2dms: function(dd) {
        dd = Math.abs(dd);

        var d = Math.floor(dd);
        var m = Math.floor((dd - d) * 60);
        var s = Math.round((dd - d - m / 60) * 3600 * 1000) / 1000;

        return d + '\u00B0 ' + m + '\u0027 ' + s + '\u0022';
    },

    degToCompass: function(num) {
	const dirs = ["N", "NNE", "NE", "ENE",
		      "E", "ESE", "SE", "SSE",
		      "S", "SSW", "SW", "WSW",
		      "W", "WNW", "NW", "NNW"];
	var index = Math.floor(((num + (360/16)/2) % 360) / (360/16));

	return dirs[index];
    },

    parseTime: function(timeStr, dt) {
	if (!dt) {
            dt = new Date();
	}
 
	var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
	if (!time) {
            return NaN;
	}

	var hours = parseInt(time[1], 10);
	if (hours == 12 && !time[3]) {
            hours = 0;
	} else {
            hours += (hours < 12 && time[3]) ? 12 : 0;
	}
 
	dt.setHours(hours);
	dt.setMinutes(parseInt(time[2], 10) || 0);
	dt.setSeconds(0, 0);

	return dt;
    }
};


class Location {
    constructor(data) {
	this._latitude = data.latitude;
	this._longitude = data.longitude;
	this._name = data.name;
	this._country = data.country;
    }

    set latitude(latitude) {
	this._latitude = latitude;
    }
    get latitude() {
	return this._latitude;
    }

    set longitude(longitude) {
	this._longitude = longitude;
    }
    get longitude() {
	return this._longitude;
    }

    set name(name) {
	this._name = name;
    }
    get name() {
	return this._name;
    }

    set country(country) {
	this._country = country;
    }
    get country() {
	return this._country;
    }
}
class Weather {
    constructor(data) {
	this._iconClass = data.iconClass;
	this._description = data.description;
	this._temperature = data.temperature;
	this._windDeg = data.windDeg;
	this._windSpeed = data.windSpeed;
	this._pressure = data.pressure;
	this._humidity = data.humidity;
	this._clouds = data.clouds;
	this._visibility = data.visibility;
    }

    set iconClass(iconClass) {
	this._iconClass = iconClass;
    }
    get iconClass() {
	return this._iconClass;
    }

    set description(description) {
	this._description = description;
    }
    get description() {
	return this._description;
    }

    set temperature(temperature) {
	this._temperature = temperature;
    }
    get temperature() {
	return this._temperature;
    }

    set windDeg(windDeg) {
	this._windDeg = windDeg;
    }
    get windDeg() {
	return this._windDeg;
    }

    set windSpeed(windSpeed) {
	this._windSpeed = windSpeed;
    }
    get windSpeed() {
	return this._windSpeed;
    }

    set pressure(pressure) {
	this._pressure = pressure;
    }
    get pressure() {
	return this._pressure;
    }

    set humidity(humidity) {
	this._humidity = humidity;
    }
    get humidity() {
	return this._humidity;
    }

    set clouds(clouds) {
	this._clouds = clouds;
    }
    get clouds() {
	return this._clouds;
    }

    set visibility(visibility) {
	this._visibility = visibility;
    }
    get visibility() {
	return this._visibility;
    }
}
class Data {
    constructor(data) {
	this._location = data.location;
	this._weather = data.weather;
	this._lastUpdate = data.lastUpdate;
    }

    set location(location) {
	this._location = location;
    }
    get location() {
	return this._location;
    }

    set weather(weather) {
	this._weather = weather;
    }
    get weather() {
	return this._weather;
    }

    set lastUpdate(lastUpdate) {
	this._lastUpdate = lastUpdate;
    }
    get lastUpdate() {
	return this._lastUpdate;
    }
}


Object.toQueryString = function(object, base) {
    var queryString = [];

    Object.keys(object).forEach(function (key) {
        var result;
        var value =  object[key];

        if(base)
            key = base + '[' + key + ']';

        switch (typeof value) {
        case 'object': 
            result = Object.toQueryString(value, key); 
            break;
        case 'array':
            var qs = {};
            value.forEach(function (val, i) {
                qs[i] = val;
            });
            result = Object.toQueryString(qs, key);
            break;
        default: 
            result = key + '=' + encodeURIComponent(value);
        }

        if(value != null)
            queryString.push(result);
    });

    return queryString.join('&');
};

function populateList(list, options) {
    options.forEach(function(option) {
        var optionEl = document.createElement('option');

        optionEl.value = option.name;

        list.appendChild(optionEl);
    });
}
function populateSelect(select, options) {
    options.forEach(function(option) {
        var optionEl = document.createElement('option');

        optionEl.value = option.name;
        optionEl.innerHTML = option.description;

        select.appendChild(optionEl);
    });
}



Date.fromJulian = function(j) {
    j = (+j)+(30.0/(24*60*60));

    var A = Date.julianArray(j, true);

    return new Date(Date.UTC.apply(Date, A));
}
Date.julianArray = function(j, n){
    var F = Math.floor;
    var j2, JA, a, b, c, d, e, f, g, h, z;

    j += .5;
    j2 = (j - F(j)) * 86400.0;
    z = F(j);
    f = j-z;

    if(z <  2299161)
	a = z;
    else {
        g = F((z-1867216.25)/36524.25);
        a = z+1+g-F(g/4);
    }

    b = a+1524;
    c = F((b-122.1)/365.25);
    d = F(365.25*c);
    e = F((b-d)/30.6001);
    h = F((e< 14)? (e-1): (e-13));

    var JA = [F((h> 2)? (c-4716): (c-4715)),
	     h-1, F(b-d-F(30.6001*e)+f)];
    var JB = [F(j2/3600), F((j2/60)%60), Math.round(j2%60)];

    JA = JA.concat(JB);

    if(typeof n== 'number')
	return JA.slice(0, n);

    return JA;
}
Date.getSeasons = function(y, wch) {
    y = y || new Date().getFullYear();

    if(y < 1000 || y > 3000)
	throw y+' is out of range';

    var Y1 = (y-2000)/1000, Y2 = Y1*Y1, Y3 = Y2*Y1, Y4 = Y3*Y1;
    var jd, t, w, d, est = 0, i= 0, Cos = Math.degCos, A = [y],
	e1= [485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8],
	e2= [324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02,
	     247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45],
	e3= [1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443,
	     65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226,
	     29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029,
	     31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074];

    while(i < 4) {
        switch(i) {
        case 0:
	    jd = 2451623.80984 + 365242.37404*Y1 + 0.05169*Y2 - 0.00411*Y3 - 0.00057*Y4;
            break;
        case 1:
	    jd = 2451716.56767 + 365241.62603*Y1 + 0.00325*Y2+ 0.00888*Y3 - 0.00030*Y4;
            break;
        case 2:
	    jd = 2451810.21715 + 365242.01767*Y1 - 0.11575*Y2 + 0.00337*Y3 + 0.00078*Y4;
            break;
        case 3:
	    jd = 2451900.05952 + 365242.74049*Y1 - 0.06223*Y2 - 0.00823*Y3 + 0.00032*Y4;
            break;
        }

        var t = (jd- 2451545.0)/36525,
            w = 35999.373*t - 2.47,
            d= 1 + 0.0334*Cos(w)+ 0.0007*Cos(2*w);

        est = 0;

        for(var n = 0; n < 24; n++) {
            est += e1[n]*Cos(e2[n]+(e3[n]*t));
        }

        jd+= (0.00001*est)/d;
        A[++i]= Date.fromJulian(jd);
    }

    return wch && A[wch] ? A[wch] : A;
}
Math.degRad = function(d){
    return (d*Math.PI)/180.0
}
Math.degSin = function(d){
    return Math.sin(Math.degRad(d))
}
Math.degCos = function(d){
    return Math.cos(Math.degRad(d))
}

