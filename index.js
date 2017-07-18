var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	rc522 = require('rc522'),
	jsforce = require('jsforce'),
	Lcd = require('lcd');

var sfConn = new jsforce.Connection({
	version: '41.0',
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


	//test
/*
	sfConn.query("SELECT Name, Id from Contact WHERE FirstName =\'" + 'Lin' + "\'", function(err, result){
				if(err) { io.emit('rfid', ''); return console.error(err);} 
				//console.log('this is the rfid: ' + rfidSerialNumber);// e558cd65  c78ba1d5
				console.log('return salesforce respone: ' + JSON.stringify(result));
				if(result && result.records && result.records.length !== 0 && result.records[0].Name) {
					io.emit('rfid', result.records[0].LastName); 
					sfConn.sobject('ParkingLotEvent__e').create({
						CarID__c: 'testId',
						NumberOfCars__c: 1,
						ParkingLotID__c: 1,
						//Time__c: Date()
						}, function(err, result){
						if(err) return console.error('get error from creating sobject', err);
						console.log('checkin event sent to IoT Cloud');
						});
				}
					
				else 
					io.emit('rfid', null);
			});
*/
	//test

	rc522(function(rfidSerialNumber){
		if(rfidSerialNumber){
			console.log('we have picked up rfid:' + rfidSerialNumber);// e558cd65  c78ba1d5
			if(rfidSerialNumberToName[rfidSerialNumber]) {
				var name = rfidSerialNumberToName[rfidSerialNumber];
				console.log("User "+name);

				function findCar(spots) { 
					for(var i = 0; i<spots.length; i++) {
						if(spots[i].Occupied && (spots[i].CarID === rfidSerialNumber) ) {
							return spots[i];
						}
					}
					return undefined;
					//return spot.Occupied && (spot.CarID === rfidSerialNumber); 
				};
				var carLeavingSpot = findCar(parkingLotSpots);

				/////////////////////////// LCD START ///////////////////////////

				lcd = new Lcd({
				    rs: 26,
				    e: 13,
				    data: [6, 5, 22, 27],
				    cols: 16,
				    rows: 1
				});
				 
				lcd.on('ready', function() {
					lcd.clear(function(err) {
						if(err) console.log("lcd clear run into error:", err);
						var msg;
						if(carLeavingSpot) {
							msg = 'ByeBye ' + name;
						} else {
							msg = 'Hello '+ name;
						}
						lcd.print(msg, 
					  	function(err, str) {
					  		if(err) {
					  			console.log("lcd print run into error:", err);
					  		}
					  		setTimeout(function () {
					  			console.log("clearing up lcd");
							    lcd.clear(function(err) {
							    	if(err) console.log("lcd clear run into error:", err);
							    	lcd.print( (NumberOfCars == 2) ? 'Garage Full' : 'Garage Open' );
							    	//lcd.close();
							    });
							}, 5000);
					  	});
					});

					
				});

				/////////////////////////// LCD END ///////////////////////////
				if (carLeavingSpot) {
					console.log(name+" is leaving parking lot spot", carLeavingSpot);
					carLeavingSpot.Occupied = false;
					carLeavingSpot.CarID = undefined;
					NumberOfCars --;
					sfConn.sobject('ParkingLotEvent__e').create({
						CarID__c: rfidSerialNumber,
						NumberOfCars__c: NumberOfCars,
						ParkingLotID__c: carLeavingSpot.ParkingLotID,
						CarIn__c: 'false',
						Full__c: (NumberOfCars>=2)?'true':'false'
						}, function(err, result){
								if(err) return console.error(err);
								console.log('event sent to IoT Cloud');
						}
					);
				} else {
					function findSpot(spots) { 
						for(var i = 0; i<spots.length; i++) {
							if(!spots[i].Occupied) {
								return spots[i];
							}
						}
						return undefined;
					};
					var emptySpot = findSpot(parkingLotSpots);
					if (emptySpot) {
						console.log(name+" is going to park at spot#"+emptySpot.ParkingLotID);
						NumberOfCars ++;
						emptySpot['Occupied'] = true;
						emptySpot['CarID'] = rfidSerialNumber;
						sfConn.sobject('ParkingLotEvent__e').create({
							CarID__c: rfidSerialNumber,
							NumberOfCars__c: NumberOfCars,
							ParkingLotID__c: emptySpot.ParkingLotID,
							CarIn__c: 'true',
							Full__c: (NumberOfCars>=2)?'true':'false'
							}, function(err, result){
								if(err) return console.error(err);
								console.log('event sent to IoT Cloud');
							}
						);
					} else {
						console.log("Parking lot full !", parkingLotSpots);
					}
				}
				
			} else {
				console.log("Please add rfid to rfidSerialNumberToName map");
			}
		}
		
	});
});

http.listen(3000, function() {
console.log('listening on port 3000');
});
