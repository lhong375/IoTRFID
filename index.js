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

app.use('/static', express.static(__dirname + '/public'))

app.get('/', function(req, res, next) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	rc522(function(rfidSerialNumber){
		if(rfidSerialNumber){
			sfConn.query("SELECT Name from Contact WHERE rfid__c =\'" + rfidSerialNumber + "\'", function(err, result){
				if(err) { io.emit('rfid', ''); return console.error(err);} 
				console.log('ths is the rfid: ' + rfidSerialNumber);
				console.log('return salesforce respone: ' + JSON.stringify(result));
				if(result && result.records && result.records.length !== 0 && result.records[0].Name) 
					io.emit('rfid', result.records[0].Name); 
				else 
					io.emit('rfid', null);
			});
			
			//send IoT cloud request here
		}
		
	});
});

http.listen(3000, function() {
console.log('listening on port 3000');
});
