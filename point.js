'use strict'

const PROTO_PATH = __dirname + '/protos/point.proto'

const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = require('grpc')
const bmt = require('./bmt/bmt')
const point_proto = grpc.load(PROTO_PATH).point

let options = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'chnpoint',
    chaincode_id: 'chaincode_point',
    network_url: 'grpc://10.178.10.173:7051',
    // endorser_url: [],
    event_url: 'grpc://10.178.10.173:7053',
    orderer_url: 'grpc://10.178.10.182:7050'
}

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
        console.log('create response: ', response)
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
        resultMessage
    }
    bmt.invoke(options,
        'pay', [call.request.transactionId,
            call.request.fromAccountNo,
            call.request.toAccountNo,
            '90000' // transactionAmount
        ]
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
        payPoint: payPoint
    })
    return server;
}

let routeServer = getServer()
routeServer.bind('localhost:60301', grpc.ServerCredentials.createInsecure())
routeServer.start()