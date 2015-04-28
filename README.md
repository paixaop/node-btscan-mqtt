# node-btscan-mqtt
Scan for bluetooth devices and publish a message to a mqtt broker for each device found

Message format is:

 <Module Name>,<device type>,<MAC Addr>,<BT device Name>

Module name is the name by which the computer running this script is known
on the network. For instance 'MasterBedroom'. Module names cannot have ','
or any other special character. Onlyletters, numbers and spaces are allowed.

Device type is 'bluetooth'
MAC Addr is the device's MAC address
BT device name is the bluetooth device's name

    Usage: btscan [options]
   
     Options:
   
       -h, --help                   output usage information
       -V, --version                output the version number
       -d, --debug                  enable debug output
       -u, --user [user]            username of the user connecting to the broker
       -P, --password <pass>        password of the user connecting to the broker
       -h, --host <host>            MQTT Broker host name or IP address
       -p, --port [n]               port the MQTT Broker is listening on. Defaults to 8883
       -c, --cafile [file]          path to a file containing trusted CA certificates to enable encrypted communication.
       -n, --name [room]            name of the module running this scrip. Defaults to room
       -t, --topic [topic]          MQTT topic to publish messages to. Defaults to device/presence
       -D, --device_type [type]     type of devices that are scanned for. Defaults to bluetooth
       -i, --interface [interface]  bluetooth interface to user. Defaults to hci0
       -T, --timeout <n>            timeout scan. Defaults to 0 or wait forever
       --protocol [proto]           MQTT protocol to use please see MQTT.js help for details. Defaults to mqtts
       --no-scan                    do not scan for devices, just connect to MQTT broker
       --no-unauthorized            if true self signed certificates will be rejected and you need to pass a cafilewith the certificate of the certificate authority you are using



## Author
Pedro Paixao

##License
MIT
