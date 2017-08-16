'use strict'

const PROTO_PATH = __dirname + '/protos/peer.proto'

const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = require('grpc')
const cert = require('./bmt/certificate')
const peer_proto = grpc.load(PROTO_PATH).peer

let options = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'chncert',
    chaincode_id: 'certificate',
    network_url: 'grpc://10.178.10.173:7051',
    // endorser_url: [],
    event_url: 'grpc://10.178.10.173:7053',
    orderer_url: 'grpc://10.178.10.182:7050'
}



// Test only

/*
let channel = {}
let client = null
let targets = []
let tx_id = null


function saveCertificate(call, callback) {
    let data = {
        result: true,
        errorMsg: ''
    }
    Promise.resolve().then(() => {
        console.log("Create a client and set the wallet location")
        client = new hfc()
        return hfc.newDefaultKeyValueStore({ path: options.wallet_path })
    }).then((wallet) => {
        console.log("Set wallet path, and associate user ", options.user_id, " with application")
        client.setStateStore(wallet)
        return client.getUserContext(options.user_id, true)
    }).then((user) => {
        console.log("Check user is enrolled, and set a query URL in the network")
        if (user === null) {
            console.error("User not defined, or not enrolled - error")
            data.result = false
            data.errorMsg = 'User not defined, or not enrolled - error'
        }
        channel = client.newChannel(options.channel_id)
        let peerObj = client.newPeer(options.network_url)
        channel.addPeer(peerObj)
        channel.addOrderer(client.newOrderer(options.orderer_url))
        targets.push(peerObj)
        callback(null, data)
        return
    }).catch((err) => {
        data.result = false
        data.errorMsg = err
        callback(null, data)
        console.error("Caught Error", err)
    })
}

*/


function saveCertificate(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    cert.invoke(options,
        'create', [call.request.serialNo, // SerialNo
            call.request.serialNo.substring(0, 3), // Issuer
            call.request.hashedSsn, // ResidentNo
            call.request.publicKey, // PublicKey
            call.request.notBefore, // StartDate
            call.request.notAfter, // EndDate
            call.request.certificate // FileCertificate
        ]
    ).then((response) => {
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
        certificate: ''
    }
    cert.query(options,
        'query', [call.request.serialNo]
    ).then((query_responses) => {
        console.log("returned from query")

        if (query_responses[0] instanceof Error) {
            data.result = false
            data.errorMsg = "error from query = " + query_responses[0]
            callback(null, data)
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            data.result = false
            data.errorMsg = "No payloads were returned from query"
            callback(null, data)
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))
            data.result = true
            data.certificate = JSON.parse(query_responses[0]).FileCertificate
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
    cert.query(options,
        'checkValidation', [call.request.serialNo,
            call.request.hashedSsn,
            call.request.signature
        ]
    ).then((query_responses) => {
        console.log("returned from query")

        if (query_responses === 'Y') {
            console.log('Successfully verify the signature')
            data.result = true
            callback(null, data)
        } else {
            console.error('Failed to verify the signature.')
            data.result = false
            data.errorMsg = query_responses
            callback(null, data)
        }

        // if (query_responses[0] instanceof Error) {
        //     data.result = false
        //     data.errorMsg = "error from query = " + query_responses[0]
        //     callback(null, data)
        //     console.error("error from query = ", query_responses[0])
        // } else if (!query_responses.length) {
        //     data.result = false
        //     data.errorMsg = "No payloads were returned from query"
        //     callback(null, data)
        //     console.log("No payloads were returned from query")
        // } else {
        //     console.log(JSON.parse(query_responses))
        //     callback(null, JSON.parse(query_responses[0])) // Return query result to grpc client
        // }
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
    cert.invoke(options,
        'discard', [call.request.serialNo,
            call.request.signature
        ]
    ).then((response) => {
        if (response === 'Y') {
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

function stop(call, callback) {
    callback(null, () => {
        routeServer.forceShutdown()
    })
}

// function main() {
//     let server = new grpc.Server()
//     server.addService(peer_proto.PeerMessagesService.service, { saveCertificate: saveCertificate, getCertificate: getCertificate, verifySignature: verifySignature, revokeCertificate: revokeCertificate, stop: stop })
//     server.bind('localhost:60301', grpc.ServerCredentials.createInsecure())
//     server.start()
// }

// main() // Initiate grpc server

function getServer() {
    let server = new grpc.Server();
    server.addService(peer_proto.PeerMessagesService.service, {
        saveCertificate: saveCertificate,
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