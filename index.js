var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	rc522 = require('rc522'),
	jsforce = require('jsforce');

var sfConn = new jsforce.Connection({
	loginUrl: 'https://corsa04-perfeng2-2015139045.vpod.t.force.com/'
});

sfConn.login("legocity@iot.com", "legolego", function(err, userInfo){
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
			sfConn.query("SELECT Name, Id from Contact WHERE rfid__c =\'" + rfidSerialNumber + "\'", function(err, result){
				if(err) { io.emit('rfid', ''); return console.error(err);} 
				console.log('ths is the rfid: ' + rfidSerialNumber);// e558cd65  c78ba1d5
				console.log('return salesforce respone: ' + JSON.stringify(result));
				if(result && result.records && result.records.length !== 0 && result.records[0].Name) {
					io.emit('rfid', result.records[0].Name); 
					sfConn.sobject('checkin__e').create({
						location__c: 'parking',//restaurant
						userid__c:result.records[0].Id,
						time__c: new Date().toISOString()
						}, function(err, result){
						if(err) return console.error(err);
						console.log('checkin event sent to IoT Cloud');
						});
				}
					
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
