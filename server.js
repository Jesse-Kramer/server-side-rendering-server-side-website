// Importeer het npm pakket express uit de node_modules map
import express from 'express'

// Importeer de zelfgemaakte functie fetchJson uit de ./helpers map
import fetchJson from './helpers/fetch-json.js'

// Stel het basis endpoint in
const apiUrl = 'https://redpers.nl/wp-json/wp/v2'

// Maak een nieuwe express app aan
const app = express()

// Stel ejs in als template engine
app.set('view engine', 'ejs')

// Zorg dat werken met request data makkelijker wordt 
app.use(express.urlencoded({extended: true}))

// Stel de map met ejs templates in
app.set('views', './views')

// Gebruik de map 'public' voor statische resources, zoals stylesheets, afbeeldingen en client-side JavaScript
app.use(express.static('public'))

// Maak een GET route voor de index
app.get('/', function (request, response) {
    // Haal alle personen uit de WHOIS API op
    var query = request.query;
  
    var url = apiUrl + '/posts';
  
  
    fetchJson(url).then((apiData) => {
      // apiData bevat gegevens van alle personen uit alle squads
      // Je zou dat hier kunnen filteren, sorteren, of zelfs aanpassen, voordat je het doorgeeft aan de view
  
      // Render index.ejs uit de views map en geef de opgehaalde data mee als variabele, genaamd persons
      response.render('index', { posts: apiData.data })
    })
  })