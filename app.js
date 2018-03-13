require('dotenv').config({
	silent: true
});

var express = require('express');
var GoogleMapsAPI = require('googlemaps');
var bodyParser = require('body-parser');

var publicConfig = {
  key: 'AIzaSyCF_BEWNwYL1dKdnb4ighYQ8dto4xtJEEI',
  secure:             true // use https
};

var gmAPI = new GoogleMapsAPI(publicConfig);



var app = express();
if (app.get('env') === 'development') {
  var livereload = require('easy-livereload');

  app.use(livereload({
    app: app,
    port: process.env.LIVERELOAD_PORT || 35729
  }));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function getStaticImg(data){
  var lat = data.geometry.location.lat.toString();
  var lng = data.geometry.location.lng.toString();
  var latlng = lat.concat(",",lng);
  return "https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=600x300&markers=color:red%7C" + latlng +"&key=AIzaSyCF_BEWNwYL1dKdnb4ighYQ8dto4xtJEEI";


}

function getHours(data){
	var raw_hours = data.opening_hours.weekday_text;
return raw_hours.join("\\n");
}

function getMapsText(data) {
	return "<" + data.url +"|"+data.name+">";
}




var data, gmapstext, gmapsaddress, gmapshours, gmapsphone, gmapsimg;



app.post("/", function(req, res) {
	var destination = req.body.text;

	var geocodeParams = {
		"address": destination,
	};

	gmAPI.geocode(geocodeParams, function(err, result){

		//res.json(result.results[0].place_id);
		var place_id = result.results[0].place_id;
		var placeDetailsParams = {"placeid" : place_id};
		gmAPI.placeDetails(placeDetailsParams, function(err, result){
			if (err) {
				console.log(err);
			} else {
				//console.log(typeof result);

				data = result.result;
				gmapstext = getMapsText(data);
				gmapsaddress = data.formatted_address;
				gmapshours = getHours(data);
				gmapsphone = data.formatted_phone_number;
				gmapsimg = getStaticImg(data)

				console.log(gmapstext, gmapsaddress, gmapshours, gmapsphone, gmapsimg);
				var slackpayload = {
					 "response_type": "in_channel",
				    "attachments": [
				        {
				            "fallback": "Error",
				            "text": gmapstext,
				            "fields": [
				                {
				                    "title": "Address",
				                    "value": gmapsaddress,
				                    "short": true
				                },
				                {
				                    "title": "Hours",
				                    "value": gmapshours || "N/A",
				                    "short": true
				                },   {
				                    "title": "Phone",
				                    "value": gmapsphone || "N/A",
				                    "short": true
				                },   {
				                    "title": "Map",
				                    "value": gmapstext,
				                    "short": true
				                }

				            ],
							"image_url": gmapsimg,
				            "color": "good"
				        }
				    ]
				};
				res.json(slackpayload);
			}

		});
	});
});

app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'), function() {
	console.log('Listening on ports ' + app.get('port'));
});
