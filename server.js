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

app.use((req, res, next) =>{
	res.locals.message = req.session.message;
	delete req.session.message;
	next();
});

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
				response.redirect('/');
			} else {
				request.session.message = {
					type: 'danger',
					intro: 'Wrong username or password! ',
					message: 'Please check the informations.'
				}
				response.redirect('/login');
			}			
			response.end();
		});
	} else {
		request.session.message = {
			type: 'danger',
			intro: 'Empty fields! ',
			message: 'Please insert username and password.'
		}
		response.redirect('/login');
	}
});

// Registrazione (/signup)
app.post('/signup', function(request, response){

	const {username, mail, password} = request.body;

	// Se i campi sono tutti settati
	if (username && mail && password){
		// Se la mail inserita è in un formato valido
		if (emailIsValid(mail)){
			// Controllo se esiste un utente con lo stesso username
			connection.query('Select * FROM utenti WHERE username = ?', [username], function(error, result, field) {
				if (error) throw error;
				// Se esiste chiedo di cambiare username
				if (result.length > 0){
					request.session.message = {
						type: 'warning',
						intro: 'Username already in use! ',
						message: 'Please change your username.'
					}
					response.redirect('/signup');
				// Se non esiste registro il nuovo utente
				} else {
					connection.query('INSERT INTO utenti SET ?', {username: username, mail: mail, password: password}, (error, results) => {
						if(error) {
							console.log(error);
						} else {
							request.session.message = {
								type: 'success',
								intro: 'Account created! ',
								message: 'Insert your data to login.'
							}
							response.redirect('/login');
						}
						response.end();
					});
				}
			});
		// Se la mail non è valida
		} else {
			request.session.message = {
				type: 'warning',
				intro: 'Mail is not in a valid format! ',
				message: 'Please control your mail.'
			}
			response.redirect('/signup');
		}
	// Se i campi non sono tutti settati chiedo di compilarli tutti
	} else {
		request.session.message = {
			type: 'danger',
			intro: 'Empty fields! ',
			message: 'Please insert username and password.'
		}
		response.redirect('/signup');
	}
});

// Funzione che controlla la validità del formato della mail
function emailIsValid(email) {
	var regex_email_valida = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regex_email_valida.test(email);
  }

// GET pagine applicazione web

app.get('/logout', function(request, response){
	request.session.loggedin = false;
	request.session.destroy();
	response.redirect('/');
});

// index.ejs
app.get('/', function(request, response) {
	response.render("pages/index", {sessione: request.session});
});


// login.html
app.get('/login', function(request, response) {
	response.render("pages/login", {sessione: request.session});
});

// registration.html
app.get('/signup', function(request, response) {
	response.render("pages/signup", {sessione: request.session});
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
		response.render("pages/profile", {username: username, nome: nome, cognome: cognome, sessione: request.session});
	});
	
});

// aboutus.html
app.get('/aboutus', function(request, response) {
	response.render("pages/aboutus", {sessione: request.session});
});

// Porta su cui ascolta il server
app.listen(5000);