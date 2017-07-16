var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	rc522 = require('rc522'),
	jsforce = require('jsforce'),
	Lcd = require('lcd');

var sfConn = new jsforce.Connection({
	loginUrl: 'https://corsa04-perfeng2-2015142130.vpod.t.force.com/'
});

sfConn.login("legocity@iot.com", "legolego", function(err, userInfo){
	if (err) { return console.error(err); } 
	console.log('logged into salesforce');
});

app.use('/static', express.static(__dirname + '/public'))

app.get('/', function(req, res, next) {
	res.sendFile(__dirname + '/index.html');
});

const rfidSerialNumberToName = {
	'e558cd65': 'Lin',
	'c78ba1d5': 'Mia',
	'3da22052': 'Isaac'
}

var parkingLotSpots = [
	{'ParkingLotID': 1}, {'ParkingLotID': 2}
];

var NumberOfCars = 0;

io.on('connection', function(socket){
	console.log('a user connected');
	rc522(function(rfidSerialNumber){
		if(rfidSerialNumber){
			console.log('we have picked up rfid:' + rfidSerialNumber);// e558cd65  c78ba1d5
			if(rfidSerialNumberToName[rfidSerialNumber]) {
				var name = rfidSerialNumberToName[rfidSerialNumber];
				console.log("User "+name);

				lcd = new Lcd({
				    rs: 26,
				    e: 13,
				    data: [6, 5, 22, 27],
				    cols: 16,
				    rows: 1
				  });
				 
				lcd.on('ready', function() {
					lcd.print('Hello, '+name, 
				  	function(err, str) {
				  		if(err) {
				  			console.log("lcd run into error:", err);
				  		}
				  		setInterval(function () {
				  			console.log("clearing up lcd");
						    lcd.clear(function(err) {
						    	if(err) console.log("lcd clear run into error:", err);
						    	lcd.close();
						    });
						}, 5000);
				  	});
				});

				var emptySpot = parkingLotSpots[0];//.find( function(spot){ return !spot.Occupied; } )

				if(emptySpot) {
					console.log(name+" is going to park at spot#"+emptySpot.ParkingLotID);
					NumberOfCars ++;
					emptySpot['Occupied'] = true;
					emptySpot['CarID'] = rfidSerialNumber;
					sfConn.sobject('ParkingLotEvent__e').create({
						CarID__c: rfidSerialNumber,
						NumberOfCars__c: NumberOfCars,
						ParkingLotID__c: emptySpot.ParkingLotID,
						//Time__c: Date()
						}, function(err, result){
							if(err) return console.error(err);
							console.log('event sent to IoT Cloud');
						}
					);
				} else {
					console.log("Parking lot full !");
				}
				
			} else {
				console.log("Please add rfid to rfidSerialNumberToName map");
			}

			
			//e558cd65 3da22052  c78ba1d5
			/*sfConn.query("SELECT Name, Id from Contact WHERE rfid__c =\'" + rfidSerialNumber + "\'", function(err, result){
				if(err) { io.emit('rfid', ''); return console.error(err);} 
				console.log('this is the rfid: ' + rfidSerialNumber);// e558cd65  c78ba1d5
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
						//Time__c: Date()
						}, function(err, result){
						if(err) return console.error(err);
						console.log('checkin event sent to IoT Cloud');
						});
				}
					
				else 
					io.emit('rfid', null);
			}); */

			//LCD start
			
			

			

			 
			/*function print(str, pos) {
			  pos = pos || 0;
			 
			  if (pos === str.length) {
			    pos = 0;
			  }
			 
			  lcd.print(str[pos]);
			 
			  setTimeout(function() {
			    print(str, pos + 1);
			  }, 300);
			}*/
			 
			// If ctrl+c is hit, free resources and exit.
			/*process.on('SIGINT', function() {
			  lcd.clear();
			  lcd.close();
			  process.exit();
			});*/

			//LCD end
			
			
			//send IoT cloud request here
		}
		
	});
});

http.listen(3000, function() {
console.log('listening on port 3000');
});
