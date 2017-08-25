#!/bin/bash
nohup node /app/bmt-sdk0/certificate.js >/app/bmt-sdk0/logs/cert-log0.txt 2>/app/bmt-sdk0/logs/cert-error0.txt &
nohup node /app/bmt-sdk1/certificate.js >/app/bmt-sdk0/logs/cert-log1.txt 2>/app/bmt-sdk0/logs/cert-error1.txt &
nohup node /app/bmt-sdk2/certificate.js >/app/bmt-sdk0/logs/cert-log2.txt 2>/app/bmt-sdk0/logs/cert-error2.txt &
nohup node /app/bmt-sdk3/certificate.js >/app/bmt-sdk0/logs/cert-log3.txt 2>/app/bmt-sdk0/logs/cert-error3.txt &
nohup node /app/bmt-sdk4/certificate.js >/app/bmt-sdk0/logs/cert-log4.txt 2>/app/bmt-sdk0/logs/cert-error4.txt &
nohup node /app/bmt-sdk5/certificate.js >/app/bmt-sdk0/logs/cert-log5.txt 2>/app/bmt-sdk0/logs/cert-error5.txt &
nohup node /app/bmt-sdk6/certificate.js >/app/bmt-sdk0/logs/cert-log6.txt 2>/app/bmt-sdk0/logs/cert-error6.txt &
nohup node /app/bmt-sdk7/certificate.js >/app/bmt-sdk0/logs/cert-log7.txt 2>/app/bmt-sdk0/logs/cert-error7.txt &
