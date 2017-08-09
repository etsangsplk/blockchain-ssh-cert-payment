'use strict'

const PROTO_PATH = __dirname + '/protos/peer.proto'

const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = requrie('grpc')
const cert = require('./bmt/certificate')
const peer_proto = grpc.load(PROTO_PATH).peer

let options = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'fabcar',
    peer_url: 'grpc://localhost:7051',
    event_url: 'grpc://localhost:7053',
    orderer_url: 'grpc://localhost:7050'
}

let channel = {}
let client = null
let targets = []
let tx_id = null

function saveCertificate(call, callback) {
    cert.createCertificate(options, call).then((response) => {
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            return tx_id.getTransactionID()
        } else {
            console.error('Failed to order the transaction. Error code: ' + response.status)
            return 'Failed to order the transaction. Error code: ' + response.status
        }
    }, (err) => {
        console.error('Failed to send transaction due to error: ' + err.stack ? err
            .stack : err)
        return 'Failed to send transaction due to error: ' + err.stack ? err.stack :
            err
    })
}



function getCertificate(call, callback) {
    cert.queryCertificate(options, call).then((query_responses) => {
        console.log("returned from query")
        
        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))            
            callback(null, JSON.parse(query_responses[0])) // Return query result to grpc client
            return query_responses[0]
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    }) 
}

function revokeCertificate(call, callback)

function stop(call, callback)

function main() {
  let server = new grpc.Server()
  server.addService(fabcar_proto.FabcarService.service, {queryCar: queryCar})
  server.bind('172.16.5.18:50051', grpc.ServerCredentials.createInsecure())
  server.start()
}

main() // Initiate grpc server