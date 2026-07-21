#!/usr/bin/perl
open(INFILE,"</dev/ttyS1");  # you may need to change this to ttyS0 to use the first serial port
while (<INFILE>) {
  if ($_ eq "[SHUTDOWN]\r\n") {
    exec("/sbin/shutdown -h now");
  } 
}

#load this as a daemon in the background in your startup;
#additionally, you'll have to set your port using stty to 9600 baud
