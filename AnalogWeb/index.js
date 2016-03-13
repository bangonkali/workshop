var arduinoPort;
var serialPort = require("serialport");

var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var ioReady = false;

app.use(express.static('public'));
app.get('/', function(req, res){
    res.sendfile('index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    //socket.on('data', function(msg){
    //    io.emit('data', msg);
    //});
    ioReady = true;
});

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

http.listen(3000, function(){
    console.log('listening on *:3000');

    serialPort.list(function (err, ports) {
        ports.forEach(function(port) {
            console.log(port.comName);
            console.log(port.pnpId);
            console.log(port.manufacturer);

            if (port.manufacturer.indexOf("Arduino") > -1){

                arduinoPort = new serialPort.SerialPort(port.comName, {
                    baudrate: 9600
                }, false);

                arduinoPort.open(function (error) {
                    if ( error ) {
                        console.log('failed to open: '+error);
                    } else {
                        console.log('open');
                        var previousData;
                        var buffer = "";

                        arduinoPort.on('data', function(data) {

                            //console.log('data received: ' + data);

                            if (ioReady) {
                                buffer += ab2str(data);

                                // Wait until there are 2 ';' in the buffer before doing anything.
                                if ((buffer.match(new RegExp(";", "g")) || []).length > 1){

                                    // Split the buffer
                                    var inputDataArray = buffer.split(";");

                                    // Send the second element within the buffer
                                    io.emit('data', inputDataArray[1]);

                                    // Clear the buffer.
                                    buffer = "";
                                }

                                // Filter input
                                //var inputData = ab2str(data);
                                //var inputDataArray = inputData.split(";");
                                //if ((inputData.match(new RegExp(";", "g")) || []).length > 1){
                                //    previousData = inputDataArray[1];
                                //}
                                //
                                //for (var i = 0; i < inputDataArray.length; i++){
                                //    if (inputDataArray[i] == previousData){
                                //        continue;
                                //    }
                                //
                                //    io.emit('data', inputDataArray[i]);
                                //    previousData = inputDataArray[i];
                                //}

                            }

                        });
                    }
                });
            }
        });
    });

});



