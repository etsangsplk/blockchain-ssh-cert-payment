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
    channel_id: 'mychannel',
    chaincode_id: 'certificate',
    network_url: 'grpc://localhost:7051',
    endorser_url: [],
    event_url: 'grpc://localhost:7053',
    orderer_url: 'grpc://localhost:7050'
}

// let channel = {}
// let client = null
// let targets = []
// let tx_id = null

// Test only
/*
function saveCertificate(call,callback) {
    let callbackResponse = { 
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
            callbackResponse.result = false
            callbackResponse.errorMsg = 'User not defined, or not enrolled - error'
        }
        channel = client.newChannel(options.channel_id)
        let peerObj = client.newPeer(options.network_url)
        channel.addPeer(peerObj)
        channel.addOrderer(client.newOrderer(options.orderer_url))
        targets.push(peerObj)
        callback(null, callbackResponse)
        return
    }).catch((err) => {
        callbackResponse.result = false
        callbackResponse.errorMsg = err
        callback(null, callbackResponse)
        console.error("Caught Error", err)
    })
}
*/

function saveCertificate(call, callback) {
    let callbackResponse = { 
        result: true,
        errorMsg: ''        
    }
    cert.invoke(options, 
            'create', 
            [ call.request.serialNo,
            call.request.hashedSsn,
            call.request.notBefore,
            call.request.notAfter,
            call.request.certificate
            ],
            callbackResponse
    ).then((response) => {
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            callbackResponse.result = true
            callback(null, callbackResponse)
        } else {
            console.error('Failed to order the transaction.')
            callback(null, callbackResponse)
        }
    }).catch((err) => {
        callbackResponse.result = false
        callbackResponse.errorMsg = err
        callback(null, callbackResponse)
        console.error("Caught Error", err)
    })
}



function getCertificate(call, callback) {
    let callbackResponse = { 
        result: true,
        errorMsg: ''        
    }
    cert.query(options, 
        'getCertificate', 
        [ call.request.serialNo ], 
        callbackResponse
    ).then((query_responses) => {
        console.log("returned from query")
        
        if (query_responses[0] instanceof Error) {
            callbackResponse.result = false
            callbackResponse.errorMsg = "error from query = " + query_responses[0]
            callback(null, callbackResponse)
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            callbackResponse.result = false
            callbackResponse.errorMsg = "No payloads were returned from query"
            callback(null, callbackResponse)
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))            
            callback(null, JSON.parse(query_responses[0])) // Return query result to grpc client
        }
    }).catch((err) => {
        callbackResponse.result = false
        callbackResponse.errorMsg = err
        callback(null, callbackResponse)
        console.error("Caught Error", err)
    }) 
}

function verifySignature(call, callback) {
    let callbackResponse = { 
        result: true,
        errorMsg: ''        
    }
    cert.query(options,
        'checkValidation',
        [ call.request.serialNo,
        call.request.hashedSsn,
        call.request.signature 
        ],
        callbackResponse
    ).then((query_responses) => {
        console.log("returned from query")
        
        if (query_responses[0] instanceof Error) {
            callbackResponse.result = false
            callbackResponse.errorMsg = "error from query = " + query_responses[0]
            callback(null, callbackResponse)
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            callbackResponse.result = false
            callbackResponse.errorMsg = "No payloads were returned from query"
            callback(null, callbackResponse)
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))            
            callback(null, JSON.parse(query_responses[0])) // Return query result to grpc client
        }
    }).catch((err) => {
        callbackResponse.result = false
        callbackResponse.errorMsg = err
        callback(null, callbackResponse)
        console.error("Caught Error", err)
    }) 
}

function revokeCertificate(call, callback) {
    let callbackResponse = { 
        result: true,
        errorMsg: ''        
    }
    cert.invoke(options, 
            'discard', 
            [ call.request.serialNo,
            call.request.signature
            ],
            callbackResponse
    ).then((response) => {
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            callbackResponse.result = true
            callback(null, callbackResponse)
        } else {
            console.error('Failed to order the transaction.')
            callback(null, callbackResponse)
        }
    }).catch((err) => {
        callbackResponse.result = false
        callbackResponse.errorMsg = err
        callback(null, callbackResponse)
        console.error("Caught Error", err)
    })
}

function stop(call, callback) {
    callback(null)
    routeServer.forceShutdown()
}

// function main() {
//   let server = new grpc.Server()
//   server.addService(peer_proto.PeerMessagesService.service, {saveCertificate: saveCertificate, getCertificate: getCertificate, verifySignature: verifySignature, revokeCertificate: revokeCertificate, stop: stop})
//   server.bind('192.168.70.7:60301', grpc.ServerCredentials.createInsecure())
//   server.start()
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
routeServe.bind('192.168.70.7:60301', grpc.ServerCredentials.createInsecure())
routeServer.start()