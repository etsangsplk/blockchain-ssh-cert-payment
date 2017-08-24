'use strict'

const PROTO_PATH = __dirname + '/protos/peer.proto'

const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = require('grpc')
const bmt = require('./bmt/bmt')
const winston = require('winston')
const fs = require('fs')

const peer_proto = grpc.load(PROTO_PATH).peer

let options = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'certificatechannel',
    chaincode_id: 'chaincode_certificate',
    network_url: 'grpc://10.178.10.162:7051',
    endorser_url: ['grpc://10.178.10.147:7051',
        'grpc://10.178.10.177:7051',
        'grpc://10.178.10.181:7051',
        'grpc://10.178.10.183:7051',
        'grpc://10.178.10.184:7051',
        'grpc://10.178.10.187:7051',
        'grpc://10.178.10.185:7051',
        'grpc://10.178.195.190:7051',
        'grpc://10.178.195.131:7051',
        'grpc://10.178.195.134:7051',
        'grpc://10.178.195.141:7051',
        'grpc://10.178.195.142:7051',
        'grpc://10.178.195.239:7051',
        'grpc://10.178.195.148:7051',
        'grpc://10.178.195.149:7051',
        'grpc://10.178.195.150:7051'
    ],
    event_url: 'grpc://10.178.10.162:7053',
    orderer_url: 'grpc://10.178.10.131:7050'
}


function saveCertificate(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.invoke(options,
        'create', [call.request.serialNo, // SerialNo
            call.request.serialNo.substring(0, 3), // Issuer
            call.request.hashedSsn, // ResidentNo
            call.request.publicKey, // PublicKey
            call.request.notBefore, // StartDate
            call.request.notAfter, // EndDate
            call.request.certificate // FileCertificate
        ]
    ).then((response) => {
        // console.log('create response: ', response)
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            data.result = true
            callback(null, data)
        } else {
            console.error('Failed to order the transaction.')
            data.result = false
            data.errorMsg = response
            callback(null, data)
        }
    }).catch((err) => {
        data.result = false
        data.errorMsg = err
        callback(null, data)
        console.error("Caught Error", err)
    })
}

function saveCertificates(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.invoke(options,
        'createCertificates', [call.request.certificateSets]
    ).then((response) => {
        // console.log("invoke response: ", response)
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            data.result = true
            callback(null, data)
        } else {
            console.error('Failed to order the transaction.')
            data.result = false
            data.errorMsg = response
            callback(null, data)
        }
    }).catch((err) => {
        data.result = false
        data.errorMsg = err
        callback(null, data)
        console.error("Caught Error", err)
    })
}


function getCertificate(call, callback) {
    let data = {
        result: false,
        errorMsg: '',
        certificate: '',
        certificateStatus: ''
    }
    bmt.query(options,
        'query', [call.request.serialNo]
    ).then((query_responses) => {
        // console.log("returned from query")

        if (query_responses[0] instanceof Error) {
            data.result = false
            data.errorMsg = "error from query = " + query_responses[0]
            callback(null, data)
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            data.result = false
            data.errorMsg = "No payloads were returned from query"
            callback(null, data)
                // console.log("No payloads were returned from query")
        } else {
            // console.log(JSON.parse(query_responses))
            let response = JSON.parse(query_responses)
            data.result = true
            data.certificate = response.fileCertificate
            data.certificateStatus = response.status
            callback(null, data) // Return query result to grpc client
        }
    }).catch((err) => {
        data.result = false
        data.errorMsg = err
        callback(null, data)
        console.error("Caught Error", err)
    })
}

function verifySignature(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.query(options,
        'checkValidation', [call.request.serialNo,
            call.request.signature,
            call.request.currentDate
        ]
    ).then((query_responses) => {
        // console.log("returned from query")
        let result = new Buffer(query_responses[0]).toString('ascii')
            // console.log('query response: ', new Buffer(query_responses[0]).toString('ascii'))
        if (result === 'Y') {
            // console.log('Successfully verify the signature')
            data.result = true
            callback(null, data)
        } else {
            console.error('Failed to verify the signature.')
            data.result = false
            data.errorMsg = query_responses[0]
            callback(null, data)
        }
    }).catch((err) => {
        data.result = false
        data.errorMsg = err
        callback(null, data)
        console.error("Caught Error", err)
    })
}

function revokeCertificate(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.invoke(options,
        'discard', [call.request.serialNo,
            call.request.signature
        ]
    ).then((response) => {
        if (response.status === 'SUCCESS') {
            // console.log('Successfully sent transaction to the orderer.')
            data.result = true
            callback(null, data)
        } else {
            console.error('Failed to order the transaction.')
            data.result = false
            data.errorMsg = response
            callback(null, data)
        }
    }).catch((err) => {
        data.result = false
        data.errorMsg = err
        callback(null, data)
        console.error("Caught Error", err)
    })
}

function stop(call, callback) {
    routeServer.tryShutdown(() => {
            callback(null)
        })
        // callback(null, () => {
        //     routeServer.forceShutdown()
        // })
}

function getServer() {
    let server = new grpc.Server();
    server.addService(peer_proto.PeerMessagesService.service, {
        saveCertificate: saveCertificate,
        saveCertificates: saveCertificates,
        getCertificate: getCertificate,
        verifySignature: verifySignature,
        revokeCertificate: revokeCertificate,
        stop: stop
    })
    return server;
}

let routeServer = getServer()
routeServer.bind('localhost:60301', grpc.ServerCredentials.createInsecure())
routeServer.start()