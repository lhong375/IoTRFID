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

//LCD start
var Lcd = require('lcd'),
  lcd = new Lcd({
    rs: 13,
    e: 24,
    data: [23, 17, 18, 22],
    cols: 8,
    rows: 2
  });
 
lcd.on('ready', function() {
  lcd.setCursor(16, 0);
  lcd.autoscroll();
  print('Hello, World! ** ');
});
 
function print(str, pos) {
  pos = pos || 0;
 
  if (pos === str.length) {
    pos = 0;
  }
 
  lcd.print(str[pos]);
 
  setTimeout(function() {
    print(str, pos + 1);
  }, 300);
}
 
// If ctrl+c is hit, free resources and exit.
process.on('SIGINT', function() {
  lcd.clear();
  lcd.close();
  process.exit();
});

//LCD end

			sfConn.query("SELECT Name, Id from Contact WHERE rfid__c =\'" + rfidSerialNumber + "\'", function(err, result){
				if(err) { io.emit('rfid', ''); return console.error(err);} 
				console.log('ths is the rfid: ' + rfidSerialNumber);// e558cd65  c78ba1d5
				console.log('return salesforce respone: ' + JSON.stringify(result));
				if(result && result.records && result.records.length !== 0 && result.records[0].Name) {
					io.emit('rfid', result.records[0].Name); 
					sfConn.sobject('ParkingLotEvent__e').create({
						//location__c: 'parking',//restaurant
						//userid__c:result.records[0].Id,
						//time__c: new Date().toISOString()
						//}, function(err, result){
						//if(err) return console.error(err);
						//console.log('checkin event sent to IoT Cloud');
						CarID__c: rfidSerialNumber,
						Occupited__c: true,
						ParkingLotID__c: 1,
						Time__c: Date()
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
