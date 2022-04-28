const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');

// Create connection with database
const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'ltw2022'
});

// Initialize express
const app = express();

app.set("view engine", "ejs");

const oneDay = 1000 * 60 * 60 * 24;

// Associate modules used with express
app.use(session({
	name: 'nome cookie sessione',
	secret: 'secret',
	resave: true,
	saveUninitialized: true,
	unset: 'keep'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Autenticazione (/auth)
app.post('/auth', (request, response) => {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM utenti WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = request.body.username;
				// Redirect to home page
				response.redirect('/index');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.post('/signup', function(request, response){

	const {username, mail, password} = request.body;

	// se i campi sono tutti settati
	if (username && mail && password){
		// TODO: aggiungere controllo su username e mail per vedere se sono già in uso
		connection.query('INSERT INTO utenti SET ?', {username: username, mail: mail, password: password}, (error, results) => {
			if(error) {
				console.log(error);
			} else {
				response.redirect('/login');
			}
			response.end();
		});
	}
	/*
	// Se username è vuoto
	if (!username) {
		response.send('Please enter Username');
	} 
	if (!mail) {
		response.send('Please enter mail');
	}
	if (!password){
		response.send('Please enter password');
	}*/

})

// Se il login è andato a buon fine
app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

// GET pagine applicazione web

// index_logged.html
app.get('/index', function(request, response) {
	response.sendFile(path.join(__dirname + '/index_logged.html'));
});

// index_unregistered.html
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/index_unregistered.html'));
});


// login.html
app.get('/login', function(request, response) {
	response.sendFile(path.join(__dirname + '/authentication/login.html'));
});

// registration.html
app.get('/signup', function(request, response) {
	response.sendFile(path.join(__dirname + '/authentication/registration.html'));
});

// profile.html
app.get('/profile', function(request, response) {

	connection.query('SELECT username, nome, cognome FROM utenti WHERE username = ?', [request.session.username], function(error, result, field) {
		if (error) throw error;
		const [record] = result
		console.log(result)
		//gestire se non c'è
		const username = record.username
		const nome = record.nome
		const cognome = record.cognome
		response.render("profile", {username: username, nome: nome, cognome: cognome});
		
	})
	
});

// aboutus.html
app.get('/aboutus', function(request, response) {
	response.sendFile(path.join(__dirname + '/aboutus.html'));
});

// Porta su cui ascolta il server
app.listen(5000);