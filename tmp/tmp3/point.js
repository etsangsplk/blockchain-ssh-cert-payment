'use strict'

const PROTO_PATH = __dirname + '/protos/point.proto'

const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = require('grpc')
const bmt = require('./bmt/bmt')
const uuidv4 = require('uuid/v4')
const point_proto = grpc.load(PROTO_PATH).point

let options = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'pointchannel',
    chaincode_id: 'chaincode_point',
    network_url: 'grpc://10.178.10.177:7051',
    endorser_url: ['grpc://10.178.10.162:7051',
        'grpc://10.178.10.147:7051',
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
    event_url: 'grpc://10.178.10.177:7053',
    orderer_url: 'grpc://10.178.10.131:7050'
}

// Create Account one by one
function createAccount(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.invoke(options,
        'createAccount', [call.request.accountNo,
            call.request.accountType,
            call.request.issuerAccount,
            call.request.accountAmount
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

// Create Account by 1000 sets
function createAccounts(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.invoke(options,
        'createAccounts', [call.request.accountSets]
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

function payPoint(call, callback) {
    let data = {
        result: false,
        errorMsg: '',
        resultMessage: ''
    }
    bmt.invoke(options,
        'pay', [call.request.transactionId,
            call.request.fromAccountNo,
            call.request.toAccountNo,
            '90000' // transactionAmount
        ]
    ).then((response) => {
        // console.log('create response: ', response)
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            let resultMessage = new Buffer(response.payload).toString('ascii')
            data.result = true
            data.resultMessage = resultMessage
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

function payPoints(call, callback) {
    let data = {
        result: false,
        errorMsg: '',
        resultMessage: ''
    }
    bmt.invoke(options,
        'payTrxs', [call.request.pointSets]
    ).then((response) => {
        console.log('create response: ', response)
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            let resultMessage = new Buffer(response.payload).toString('ascii')
            data.result = true
            data.resultMessage = resultMessage
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


function getServer() {
    let server = new grpc.Server();
    server.addService(point_proto.BmtPointService.service, {
        createAccount: createAccount,
        createAccounts: createAccounts,
        payPoint: payPoint,
        payPoints: payPoints
    })
    return server;
}

let routeServer = getServer()
routeServer.bind('localhost:60302', grpc.ServerCredentials.createInsecure())
routeServer.start()
