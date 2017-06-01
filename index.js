var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	rc522 = require('rc522'),
	jsforce = require('jsforce');

var sfConn = new jsforce.Connection({});
sfConn.login("kapil.gowru@iotsupporttraining.com", "test!234", function(err, userInfo){
	if (err) { return console.error(err); } 
	
	console.log('logged into salesforce');
});

app.get('/', function(req, res, next) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	rc522(function(rfidSerialNumber){
		if(rfidSerialNumber){
			sfConn.query("SELECT Name from Contact WHERE rfid__c =\'" + rfidSerialNumber + "\'", function(err, result){
				console.log('ths is the rfid: ' + rfidSerialNumber);
				if(result.records[0].Name) 
					io.emit('rfid', result.records[0].Name); 
				else 
					io.emit('rfid', null);
				console.log("returned contact object", JSON.stringify(result));
			});
			
			//send IoT cloud request here
		}
		
	});
});

http.listen(3000, function() {
console.log('listening on port 3000');
});
