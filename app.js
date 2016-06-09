var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var cons = require('consolidate');
var app = express();
var mongo = require('mongodb');
require('events').EventEmitter.prototype._maxListeners = 100;
app.engine('html', cons.jade);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server;

var mongoClient = new MongoClient(new Server('localhost', 27017));

app.get('/', function (req, res) {
	res.render('index');
});

app.getStatsAndRender = function(result, res) {
	var sumSalaire = 0;
	var count = 0;
	var minItem = null;
	var maxItem = null;
	result.forEach(function(item) {
		if (minItem == null || minItem.salaire > item.salaire)
			minItem = item;
		if (maxItem == null || maxItem.salaire < item.salaire)
			maxItem = item;
		sumSalaire += parseInt(item.salaire);
		count += 1;
	});
	console.log(minItem);
	res.render('statistiques', {min : minItem, max: maxItem, average: (sumSalaire / count)});
}
app.get('/statistiques', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');
		collection.find({}).toArray(function (err, result) {
			app.getStatsAndRender(result, res);
			db.close();
		});
	});
});

app.get('/collaborateurs', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');
		collection.find({}).toArray(function (err, result) {
			res.render('collaborateurs', {collabs: result});
			db.close();
		});
	});
});

app.get('/collaborateurs/new', function(req, res) {
	res.render('collaborateurNew');
});

app.get('/collaborateurs/:id', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');
		collection.find({"_id" : new mongo.ObjectID(req.params.id)}).toArray(function (err, result) {
			db.close();
			res.render('collaborateurDetail', {collabs: result});
		});
	});
});

app.get('/collaborateurs/:id/edit', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');
		collection.find({"_id" : new mongo.ObjectID(req.params.id)}).toArray(function (err, result) {
			db.close();
			res.render('collaborateurEdit', {id: req.params.id, collabs: result});
		});
	});
});

app.post('/collaborateurs/:id/delete', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');
		collection.update({"_id" : new mongo.ObjectID(req.params.id)}, {$set: {"enddate": new Date(), "motif": req.body.motif}});
		db.close();
	});
	res.redirect('/collaborateurs');
});

app.get('/collaborateurs/:id/delete', function(req, res) {
	res.render('collaborateurDelete', {id: req.params.id});
});

app.post('/collaborateurs/:id/edit', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');
		collection.update({"_id" : new mongo.ObjectID(req.params.id)}, {$set: {
			"nom" : req.body.nom,
			"prenom" : req.body.prenom,
			"birthdate" : req.body.birthdate,
			"poste" : req.body.poste,
			"salaire" : req.body.salaire,
			"startdate" : req.body.startdate,
			"entrynumber" : req.body.entrynumber,
			"email" : req.body.email
		}});
		db.close();
	});
	res.redirect('/collaborateurs');
});

app.post('/collaborateurs', function(req, res) {
	app.db.open(function(err, db) {
		var collection = db.collection('employe');

		collection.insertOne({
			"nom" : req.body.nom,
			"prenom" : req.body.prenom,
			"birthdate" : req.body.birthdate,
			"poste" : req.body.poste,
			"salaire" : req.body.salaire,
			"startdate" : req.body.startdate,
			"enddate" : null,
			"motif": null,
			"entrynumber" : req.body.entrynumber,
			"email" : req.body.email
		}, function(err, result) {
			console.log("Inserted a document into the restaurants collection.");
			db.close();
		});
	});
	res.redirect('/collaborateurs');
});

app.post('/collaborateurs/:id', function(req, res) {	
});

app.get('*', function(req, res) {
	res.send("Page not found !", 404);
});

MongoClient.connect('mongodb://localhost:27017/tpnode', function(err, db) {
	app.db = db;
	app.listen(8000);
	console.log("Server started on 8000");
})
