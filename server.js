const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

// Create connection with database
const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'ltw2022'
});

// Create storage on disk to save uploaded images
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/images')
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname))
	}
})

const upload = multer({storage: storage});

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
		connection.query('SELECT immagine FROM utenti WHERE username = ?', [username], function(error, results) {
			if (error) {
				console.log(error);
			} else {
				request.session.profile_image = results[0].immagine;
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
			}

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
						message: 'Please change your username or login.'
					}
					response.redirect('/signup');
				// Se non esiste registro il nuovo utente
				} else {
					request.session.profile_image = 'default_1.jpg';
					connection.query('INSERT INTO utenti SET ?', {username: username, mail: mail, password: password, immagine: "default_1.jpg"}, (error, results) => {
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
			message: 'Please insert username, name, email and password.'
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
	connection.query('SELECT immagine FROM immagini WHERE profile_image = false', function(error, result, field) {
		if (error) throw error;
		const [prova] = result;
		response.render("pages/index", {sessione: request.session, risultati: result})
	});
});


// login.ejs
app.get('/login', function(request, response) {
	response.render("pages/login", {sessione: request.session});
});

// registration.ejs
app.get('/signup', function(request, response) {
	response.render("pages/signup", {sessione: request.session});
});

// profile.ejs
app.get('/profile', function(request, response) {
	connection.query('SELECT username, nome, cognome, immagine FROM utenti WHERE username = ?', [request.session.username], function(error, result, field) {
		if (error) throw error;
		const [record] = result
		console.log(result)
		//gestire se non c'è
		const username = record.username
		const nome = record.nome
		const cognome = record.cognome
		const immagine_profilo = record.immagine
		connection.query('SELECT immagine FROM immagini WHERE username = ? AND profile_image = false', [request.session.username], function(error, result, field) {
			if (error) throw error;
			const [prova] = result;
			response.render("pages/profile", {username: username, nome: nome, cognome: cognome, immagine_profilo: immagine_profilo, sessione: request.session, risultati: result})
		});
	});
});

// aboutus.ejs
app.get('/aboutus', function(request, response) {
	response.render("pages/aboutus", {sessione: request.session});
});

// upload.ejs
app.get('/upload', function(request, response) {
	response.render("pages/upload", {sessione: request.session});
});

// image.ejs
app.get('/image/:tagId', function(request, response) {
	connection.query('SELECT * FROM immagini WHERE immagine = ?', [request.params.tagId], (error, results) => {
		response.render("pages/image", {sessione: request.session, tagID: request.params.tagId, risultato: results});
	});
});

// user.ejs
app.get('/user/:username', function(request, response) {
	connection.query('SELECT immagine FROM immagini WHERE username = ? AND profile_image = false', [request.params.username], (error, results) => {
		connection.query('SELECT mail, nome, cognome, immagine FROM utenti WHERE username = ?', [request.params.username], (error, results_1) => {
			if (error){
				console.log(error);
			} else {
				response.render("pages/user", {sessione: request.session, user: request.params.username, risultato_img: results, risultato_user: results_1});
			}
		});
	});
});

// POST

// Salva l'immagine nella cartella "images"
app.post('/uploadImage', upload.single('image'), function(request, response) {
	if (request.file !== undefined){
		connection.query('INSERT INTO immagini SET ?', {username: request.session.username, immagine: request.file.filename, camera: request.body.camera, lente: request.body.lens, iso: request.body.ISO, f: request.body.F, profile_image: false, shutter_speed: request.body.shutter_speed, distanza: request.body.focal_length, categoria: request.body.categoria}, (error, results) => {
			if(error) {
				console.log(error);
			} else {
				request.session.message = {
					type: 'success',
					intro: 'Image uploaded successfully! ',
					message: ''
				}
				response.redirect('/upload');
			}
			
		});
	} else {
		request.session.message = {
			type: "danger",
			intro: "Please select an image! ",
			message: ''
		}
		response.redirect('/upload');
	}
});

// Cambia immagine profilo
app.post('/profile_img_change', upload.single('image'), function(request, response) {
	if (request.file !== undefined){
		request.session.profile_image = request.file.filename;
		connection.query('INSERT INTO immagini SET ?', {username: request.session.username, immagine: request.file.filename, profile_image: true}, (error, results) => {
			connection.query('UPDATE utenti SET immagine = ? WHERE utenti.username = ?', [request.file.filename, request.session.username], (error, results) => {
				if(error)
					console.log(error);
			});
			if(error) {
				console.log(error);
			} else {
				request.session.message = {
					type: "success",
					intro: "Profile image changed successfully! ",
					message: ''
				}
				response.redirect('/profile');
			}
		});
	} else {
		request.session.message = {
			type: "danger",
			intro: "Select an image ",
			message: ''
		}
		response.redirect('/profile');
	}
	
});

// Cambia nome
app.post('/change_name', function(request, response) {
	connection.query('UPDATE utenti SET nome = ? WHERE utenti.username = ?', [request.body.newName, request.session.username], (error, results) => {
		if(error){
			console.log(error);
		} else {
			request.session.message = {
				type: "success",
				intro: "Name changed successfully! ",
				message: ''
			}
			response.redirect('/profile');
		}
	});
});

// Cambia cognome
app.post('/change_surname', function(request, response) {
	connection.query('UPDATE utenti SET cognome = ? WHERE utenti.username = ?', [request.body.newSurname, request.session.username], (error, results) => {
		if(error){
			console.log(error);
		} else {
			request.session.message = {
				type: "success",
				intro: "Surname changed successfully! ",
				message: ''
			}
			response.redirect('/profile');
		}
	});
});

// Cambia username
app.post('/change_username', function(request, response) {
	connection.query('SELECT * FROM utenti WHERE username = ?', [request.body.newUsername], (error, results) => {
		if(error){
			console.log(error);
		// se l'username già esiste
		} else if (results.length > 0){
			request.session.message = {
				type: "danger",
				intro: "Username already in use! ",
				message: 'Please choose another one.'
			}
			response.redirect('/profile');
		// se invece non esiste lo imposto
		} else {
			connection.query('UPDATE utenti SET username = ? WHERE utenti.username = ?', [request.body.newUsername, request.session.username], (error, results) => {
				if(error){
					console.log(error);
				} else {
					connection.query('UPDATE immagini SET username = ? where immagini.username = ?', [request.body.newUsername, request.session.username], (error, results) => {
						if(error){
							console.log(error);
						} else {
							request.session.username = request.body.newUsername;
							request.session.message = {
								type: "success",
								intro: "Username changed successfully! ",
								message: ''
							}
							response.redirect('/profile');
						}
					});
				}
			});
		}
	});
});

// Cambia password
app.post('/psw_change', function(request, response) {
	connection.query('SELECT password FROM utenti WHERE username = ?', [request.session.username], (error, results) => {
		if (error){
			console.log(error);
		// Se la password vecchia inserita è giusta e la password nuova combacia allora la cambio
		} else if (request.body.oldPsw == results[0].password && request.body.newPsw1 == request.body.newPsw2) {
			connection.query('UPDATE utenti SET password = ? WHERE utenti.username = ?', [request.body.newPsw1, request.session.username], (error, results) => {
				if(error){
					console.log(error);
				} else {
					request.session.message = {
						type: "success",
						intro: "Password changed successfully! ",
						message: ''
					}
					response.redirect('/profile');
				}
			});
		} else {
			request.session.message = {
				type: "danger",
				intro: "Incorrect data! ",
				message: "please check the data"
			}
			response.redirect("/profile");
		}
	});
});

// Ricerca utente
app.post('/searchUser', function(request, response) {
	connection.query('SELECT username FROM utenti WHERE username = ?', [request.body.user_search], (error, results) => {
		if (error) {
			console.log(error);
		// se non viene trovato un utente con quel nome
		} else if (results.length < 1){
			response.redirect("/");
		} else {
			response.redirect("/user/"+results[0].username);
		}
	});
});

// Porta su cui ascolta il server
app.listen(5000);