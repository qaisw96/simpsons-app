'use strict'
// Application Dependencies
const express = require('express');
const pg = require('pg');
const methodOverride = require('method-override');
const superagent = require('superagent');
const cors = require('cors');

// Environment variables
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({extended: true}))
// Specify a directory for static resources
app.use(express.static('./public'))
// define our method-override reference
app.use(methodOverride('_method'))

// Set the view engine for server-side templating
app.set('view engine', 'ejs')

// Use app cors
app.use(cors())

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);

// app routes here
// -- WRITE YOUR ROUTES HERE --
app.get('/', getFromApiAndRender)
app.post('/saved', saveToDB)
app.get('/favorite-quotes', renderFromDB)

app.get('/favorite-quotes/:quote_id', viewDetails)
app.put('/favorite-quotes/:quote_id', updateQuote)
app.delete('/favorite-quotes/:quote_id', deleteQuote)



// callback functions
// -- WRITE YOUR CALLBACK FUNCTIONS FOR THE ROUTES HERE --

function getFromApiAndRender(req, res) {
    const url = 'https://thesimpsonsquoteapi.glitch.me/quotes?count=10'
    superagent.get(url).set('User-Agent', '1.0').then(results => {
        const quotesApi = results.body.map(obj => new Quote(obj))
        // console.log(quotes);
        res.render('pages/index', {quotes:quotesApi })

    })
        // const quotesApi = results.map(obj => new Quote(obj))
        // res.render('pages/index', {quotes: quotesApi})
    
} 

function saveToDB(req, res) {
    const {quote, character, image, characterDirection} = req.body
    
    const insertSql = 'INSERT INTO quotes(quote, character, image, characterDirection) VALUES($1, $2, $3, $4);'

    const val = [quote, character, image, characterDirection]

    client.query(insertSql, val).then(() => res.redirect('/favorite-quotes'))
}

function renderFromDB(req, res) {
    const sql = 'SELECT * FROM quotes;'
    
    client.query(sql).then(results => {
        res.render('pages/saved-quotes', {quotes: results.rows})
    })
}


function viewDetails(req, res) {
    const qouteId = req.params.quote_id

    const sql = 'SELECT * FROM quotes WHERE id=$1;'
    const val = [qouteId]

    client.query(sql, val).then(results => {
        res.render('pages/details', {quotes: results.rows})
    })
}

function updateQuote(req, res) {
    const qouteId = req.params.quote_id

    const {quote, character, image, characterDirection} = req.body
    const sql = 'UPDATE quotes SET quote=$1, character=$2, image=$3, characterDirection=$4 WHERE id=$5;'

    const val = [quote, character, image, characterDirection, qouteId ]

    client.query(sql, val).then(() => {
        res.redirect(`/favorite-quotes/${qouteId}`)
    })

}

function deleteQuote(req, res) {
    const qouteId = req.params.quote_id

    const sql = 'DELETE FROM quotes WHERE id=$1;'
    const val = [qouteId]

    client.query(sql, val).then(() => res.redirect('/favorite-quotes'))
}

// helper functions

function Quote(obj) {
    this.quote = obj.quote
    this.character = obj.character
    this.image = obj.image
    this.characterDirection = obj.characterDirection
}



// app start point
client.connect().then(() => {  
    console.log('connect DB');
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
});

app.use('*', (req, res) => res.send('There is no route'))
