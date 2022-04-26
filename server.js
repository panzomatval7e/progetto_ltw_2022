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

// Associate modules used with express
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Autenticazione (/auth)
app.post('/auth', function(request, response) {
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
				request.session.username = username;
				// Redirect to home page
				response.redirect('/home');
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

// index.html
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/index.html'));
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
	response.sendFile(path.join(__dirname + '/profile/profile.html'));
});

// aboutus.html
app.get('/aboutus', function(request, response) {
	response.sendFile(path.join(__dirname + '/aboutus.html'));
});

// Porta su cui ascolta il server
app.listen(5000);