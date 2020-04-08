'use strict'


////////////////Load enviroment variables
require('dotenv').config();
///////////////using app dependancies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent')
const pg = require('pg');
///////////////initilizing the server///////////////
const app = express();

////////////////////giving permission to connect to the server//////////////////////////
app.use(cors());

const PORT = process.env.PORT || 4000;
//////////////Connect to PSQL using the provided link in .env/////////////////////
const client = new pg.Client(process.env.DATABASE_URL) // pg is constructor function which have client method
// client.on('error', error => { throw new Error(error) });


///////////////////////////Route Definition////////////////////////////////////////////

app.get('/', (req, res) => { res.status(200).json('Home Page') });
app.get('/location', LocationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);

//////////////////Routes Handlers/////////////////////

function LocationHandler(req, res) {
    let cityName = req.query.city;

    let SQL = 'SELECT * FROM citylocation WHERE search_query=$1;'
    let safeValue = [cityName];
     console.log('ciry1', cityName);
   
    client.query(SQL, safeValue)
        .then(result => {
            if (result.rowCount > 0) {

                console.log('hello1');
console.log(result.rows[0]);

                res.status(200).json(result.rows[0])

            } else {
                
                console.log('hey');

                superagent(`https://eu1.locationiq.com/v1/search.php?key=${process.env.Location_API_KEY}&q=${cityName}&format=json`)

                    .then((locationApiRes) => {

                        const locationDataFromApi = locationApiRes.body;
                        let reformingApiData = new Location(cityName, locationDataFromApi);

                        const SQL = 'INSERT INTO citylocation(search_query,searchcity,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;'
                        let objectValues = Object.values(reformingApiData);
                         console.log(objectValues);
                        
                        client.query(SQL, objectValues)
                        .then(results => {

                            res.status(200).json(reformingApiData);
                        })
                            .catch(error =>{errorhandler(req,res,error)})

                    })
                   
            }


        })

}

function weatherHandler(req, res) {
    const city = req.query.search_query;
    console.log('city',req.query);
superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&maxDistance=500&key=${process.env.WEATHER_API_KEY}`)
        .then((apiResponse) => {

            let weatherData = apiResponse.body.data.map((value) => {
                return new Weather(value);
            })
            res.status(200).json(weatherData);
        })
        .catch(error => { errorhandler( req, res, error) })
}


function trailsHandler(req, res) {
    // let lon = req.params.longitude
    // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    superagent(`https://www.hikingproject.com/data/get-trails?lat=${req.query.latitude}&lon=${req.query.longitude}&maxDistance=500&key=${process.env.TRAIL_API_KEY}`)
        .then((trailsApiResponse) => {
            // console.log(trailsApiResponse);
            //get the data from the api
            const trailsData = trailsApiResponse.body.trails.map((data) => {
                return new Trails(data);
            })
            res.status(200).json(trailsData);
        })
            .catch(error => { errorhandler( req, res, error) })
}


////////////////Constructors//////////////////
function Location(city, locationDataFromApi) {
    this.search_query = city;
    this.formatted_query = locationDataFromApi[0].display_name;
    this.latitude = locationDataFromApi[0].lat;
    this.longitude = locationDataFromApi[0].lon;
}

function Weather(value) {
    this.forecast = value.weather.description;
    this.time = new Date(value.datetime).toDateString();
}

function Trails(data) {
    this.name = data.name;
    this.location = data.location;
    this.length = data.length;
    this.stars = data.stars;
    this.star_votes = data.starVotes;
    this.summary = data.summary;
    this.trail_url = data.url;
    this.conditions = data.conditionDetails;
    this.condition_date = new Date(data.conditionDate).toLocaleDateString();
    this.condition_time = new Date(data.conditionDate).toLocaleTimeString();
}

function errorhandler(req, res, error) {
  
    res.status(500).json(error);
};

client
    .connect()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`my server is up and running on port ${PORT}`)
        );
    })
    .catch((err) => {
        throw new Error(`startup error ${err}`);
    });