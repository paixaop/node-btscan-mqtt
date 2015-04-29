#!/usr/bin/env node
/**
 * Scan for bluetooth devices and, if found, send a message to
 * to MQTT Broker's topic
 *
 * Author: Pedro Paixao
 * License: MIT
 */
var mqtt = require('mqtt');
var fs = require('fs');

var Scanner = require("bluetooth-scanner");
var cli = require('commander');

var options = {};

cli
  .version('1.0.0')
  .usage('[options]')
  .option('-d, --debug',       'enable debug output')
  .option('-u, --user [user]',
          'username of the user connecting to the broker')
  .option('-P, --password <pass>',
          'password of the user connecting to the broker')
  .option('-h, --host <host>',
          'MQTT Broker host name or IP address')
  .option('-p, --port [n]',
          'port the MQTT Broker is listening on. Defaults to 1883',
          parseInt,
          1883)
  .option('-c, --cafile [file]',
          'path to a file containing trusted CA certificates to enable encrypted communication.')
  .option('-i, --id [room]',
          'client Id of the module running this scrip. Defaults to room',
          'room')
  .option('-t, --topic [topic]',
          'MQTT topic to publish messages to. Defaults to device/presence',
          'device/presence')
  .option('-D, --device_type [type]',
          'type of devices that are scanned for. Defaults to bluetooth',
          'bluetooth')
  .option('-I, --interface [interface]',
          'bluetooth interface to user. Defaults to hci0',
          'hci0')
  .option('-T, --timeout <n>',
          'timeout scan. Defaults to 0 or wait forever',
          parseInt,
          0)
  .option('--protocol [proto]',
          'MQTT protocol to use please see MQTT.js help for details. Defaults to mqtt',
          'mqtt')
  .option('--no-scan', 'do not scan for devices, just connect to MQTT broker')
  .option('--no-unauthorized',
          'if true self signed certificates will be rejected and you need to pass a cafile' +
          'with the certificate of the certificate authority you are using',
          true);
  
  
  cli.on('--help', function(){
    console.log('  Scan for Bluetooth devices and publish a message to a MQTT Broker for each device found.\n');
    console.log('  Message format:\n');
    console.log('    <Module Name>,<Device Type>,<MAC Addr>,<Device Name>\n');
    console.log('  Where:\n');
    console.log('    <Module Name> is the name by which the computer running this script is known');
    console.log('                  on the network. For instance \'MasterBedroom\'. Module names cannot have \',\'.');
    console.log('                  or any other special character. Onlyletters, numbers and spaces are allowed.');
    console.log('');
    console.log('    <Device Type> defaults to \'bluetooth\'\n');
    console.log('    <MAC Addr>    is the device\'s MAC address\n');
    console.log('    <Device Name> is the bluetooth device\'s name\n');
    console.log('');
  });
  
  cli.parse(process.argv);
  

if (!cli.host) {
  console.log('please specify host of the mqtt broker');
  cli.outputHelp();
  process.exit();
}


require("console-stamp")(console, "HH:MM:ss.l", '[' + process.pid + ']');

options.host = cli.host;
options.port = cli.port;

console.log("MQTT Broker: " + options.host + ":" + options.port);

if (cli.user) {
  console.log('MQTT user:', cli.user);
  options.username = cli.user;
  
  if (!cli.password) {
    console.log('please set user\'s password');
    cli.outputHelp();
    process.exit();
  }
  options.password = cli.password;
}
else {
  console.log('username not set, please make sure the mqtt broker accepts annonymous connections.');
}
console.log('MQTT protocol:', cli.protocol);
options.protocol = cli.protocol;


if(!cli.scan) {
  console.log('no-scan enabled, just testing MQTT not scanning for devices');
  if (!cli.timeout) {
    cli.timeout = 15000;
  }
}

if (cli.timeout) {
  console.log('scan timeout:', cli.timeout, 'ms');
}
else {
  console.log('scan timeout: 0. Will not timeout the scan');
}

// Check Command line options
console.log('using interface:', cli.interface);

console.log('device type:', cli.device_type);
console.log('mqtt topic:', cli.topic);
console.log('client id:', cli.id);

if (cli.cafile) {
  console.log('CA certificate:', cli.cafile);
  try {
    options.ca = [fs.readFileSync(cli.cafile)];
  } catch (e) {
    console.error('could not read ca file.', e.toString());
    process.exit();
  }  
}

if (cli.unauthorized) {
  if (cli.cafile) {
    console.log('rejecting unauthorized certificates');
  }
  else {
    console.log('rejecting unauthorized certificates. If broker uses a self signed certificate you should pass a cafile');    
  }
}
else {
  console.warn('accepting unauthorized certificates. This may be a security problem');  
}
options.rejectUnauthorized = cli.unauthorized;


console.log('connecting...');
console.time( "MQTT connection time" );
var client = mqtt.connect(options);

client.on('connect', function () {
  console.log('MQTT Broker Conncetion OK');
  console.timeEnd("MQTT connection time");
  
  if (cli.scan) {
    
    client.publish(cli.topic, {
      name: cli.id,
      device_type: cli.device_type,
      command: 'scan start'
    });
    
    if (cli.timeout) {
      
      setTimeout(function() {
        
        client.publish(cli.topic, {
          id: cli.id,
          device_type: cli.device_type,
          command: 'scan timeout'
        });
        
        console.log('Timeout. Terminating scanner.');
        
        if (scanner) {
          scanner.destroy;  
        }
        
        process.exit();
      
      }, cli.timeout);
      
    }

    // Start Scan
    var scanner = new Scanner(cli.interface);
    
    scanner.on('device', function(result) {
      var mac = result[1];
      var name = result[2];

      // <Module Id>,<device type>,<MAC Addr>,<BT device Name>
      var msg = cli.id + ',' + cli.device_type + ',' + mac + ',' + name;
      
      if (cli.debug) {
        console.log('publish message. Topic: ' + cli.topic + ' - ' + msg);
      }
      
      client.publish(cli.topic, {
        id: cli.id,
        device_type: cli.device_type,
        mac: mac,
        name: name,
        command: 'scan timeout'
      });
      
    });
    
    scanner.on('done', function(message) {
      console.log('scanner exit:', message);
      process.exit();
    });
    
    scanner.on('error', function(error) {
      console.log(error);
      process.exit();
    });
    
  }
  else {
    console.log('not scanning for devices...');
  }
});

client.on('message', function(topic, message) {
  console.log('Message:', topic, message.toString('ascii'));
});

client.on('error', function(error) {
  console.log('MQTT Broker ' + error.toString());
  process.exit();
});

client.on('close', function(message) {
  console.log('Closed. Bye');
  process.exit();
});

client.on('offline', function(message) {
  console.log('going offline');
  process.exit();
});
