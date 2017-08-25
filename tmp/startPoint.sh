#!/bin/bash
nohup node /app/bmt-sdk0/point.js >/app/bmt-sdk0/logs/point-log0.txt 2>/app/bmt-sdk0/logs/point-error0.txt &
nohup node /app/bmt-sdk1/point.js >/app/bmt-sdk0/logs/point-log1.txt 2>/app/bmt-sdk0/logs/point-error1.txt &
nohup node /app/bmt-sdk2/point.js >/app/bmt-sdk0/logs/point-log2.txt 2>/app/bmt-sdk0/logs/point-error2.txt &
nohup node /app/bmt-sdk3/point.js >/app/bmt-sdk0/logs/point-log3.txt 2>/app/bmt-sdk0/logs/point-error3.txt &
nohup node /app/bmt-sdk4/point.js >/app/bmt-sdk0/logs/point-log4.txt 2>/app/bmt-sdk0/logs/point-error4.txt &
nohup node /app/bmt-sdk5/point.js >/app/bmt-sdk0/logs/point-log5.txt 2>/app/bmt-sdk0/logs/point-error5.txt &
nohup node /app/bmt-sdk6/point.js >/app/bmt-sdk0/logs/point-log6.txt 2>/app/bmt-sdk0/logs/point-error6.txt &
nohup node /app/bmt-sdk7/point.js >/app/bmt-sdk0/logs/point-log7.txt 2>/app/bmt-sdk0/logs/point-error7.txt &
