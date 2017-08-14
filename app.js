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

let channel = {}
let client = null
let targets = []
let tx_id = null

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
        let peerObj = client.newPeer(options.network_url);
        channel.addPeer(peerObj)
        channel.addOrderer(client.newOrderer(options.orderer_url))
        targets.push(peerObj)
        return
    }).then(() => {
        tx_id = client.newTransactionID()
        console.log("Assigning transaction_id: ", tx_id._transaction_id)
        // send proposal to endorser
        let request = {
            targets: targets,
            chaincodeId: options.chaincode_id,
            fcn: 'saveCertificate',
            args: [ call.request.serialNo,
                    call.request.hashedSsn,
                    call.request.notBefore,
                    call.request.notAfter,
                    call.request.certificate
                    ],
            chainId: options.channel_id,
            txId: tx_id
        }
        return channel.sendTransactionProposal(request)
    }).then((results) => {
        let proposalResponses = results[0]
        let proposal = results[1]
        let header = results[2]
        let isProposalGood = false
        if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
            isProposalGood = true
            console.log('Transaction proposal was good')
        } else {
            console.error('Transaction proposal was bad')
            if (callbackResponse.result) {
                callbackResponse.result = false
                callbackResponse.errorMsg = 'The transaction proposal was invalid'
            }
        }
        if (isProposalGood) {
            console.log(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature))
            let request = {
                proposalResponses: proposalResponses,
                proposal: proposal,
                header: header
            }
            // set the transaction listener and set a timeout of 30sec
            // if the transaction did not get committed within the timeout period,
            // fail the test
            let transactionID = tx_id.getTransactionID()
            let eventPromises = []
            let eh = client.newEventHub()
            eh.setPeerAddr(options.event_url)
            eh.connect()

            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    eh.disconnect()
                    reject()
                }, 30000)

                eh.registerTxEvent(transactionID, (tx, code) => {
                    clearTimeout(handle)
                    eh.unregisterTxEvent(transactionID)
                    eh.disconnect()

                    if (code !== 'VALID') {
                        console.error('The transaction was invalid, code = ' + code)
                        if (callbackResponse.result) {
                            callbackResponse.result = false
                            callbackResponse.errorMsg = 'The transaction was invalid, code = ' + code
                        }
                        reject()
                    } else {
                        console.log('The transaction has been committed on peer ' + eh._ep._endpoint.addr)
                        resolve()
                    }
                })
            })
            eventPromises.push(txPromise)
            let sendPromise = channel.sendTransaction(request)
            return Promise.all([sendPromise].concat(eventPromises)).then((results) => {
                console.log(' event promise all complete and testing complete')
                return results[0] // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
            }).catch((err) => {
                console.error(
                    'Failed to send transaction and get notifications within the timeout period.'
                )
                if (callbackResponse.result) {
                    callbackResponse.result = false
                    callbackResponse.errorMsg = 'Failed to send transaction and get notifications within the timeout period.'
                }
                return 'Failed to send transaction and get notifications within the timeout period.'
            })
        } else {
            console.error(
                'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
            )
            if (callbackResponse.result) {
                callbackResponse.result = false
                callbackResponse.errorMsg = 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
            }
            return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
        }
    }).then((response) => {
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
        }
        channel = client.newChannel(options.channel_id)
        channel.addPeer(client.newPeer(options.network_url))
        return
    }).then(() => {
        console.log("Make query")
        let transaction_id = client.newTransactionID();
        console.log("Assigning transaction_id: ", transaction_id._transaction_id);
        let request = {
            chaincodeId: options.chaincode_id,
            txId: transaction_id,
            fcn: 'getCertificate',
            args: [ call.request.serialNo ]
        }
        return channel.queryByChaincode(request);
    }).then((query_responses) => {
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

function verifySignature(call, callback) {
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
        }
        channel = client.newChannel(options.channel_id)
        channel.addPeer(client.newPeer(options.network_url))
        return
    }).then(() => {
        console.log("Verify Signature")
        let transaction_id = client.newTransactionID();
        console.log("Assigning transaction_id: ", transaction_id._transaction_id);
        let request = {
            chaincodeId: options.chaincode_id,
            txId: transaction_id,
            fcn: 'checkValidation',
            args:  [ call.request.serialNo,
                    call.request.hashedSsn,
                    call.request.signature 
                    ]
        }
        return channel.queryByChaincode(request);
    }).then((query_responses) => {
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

function revokeCertificate(call, callback) {
    let callbackResponse = { 
        result: true,
        errorMsg: ''        
    }
    callback(null, callbackResponse);
}

function stop(call, callback) {
    let callbackResponse = { 
        result: true,
        errorMsg: ''        
    }
    callback(null, callbackResponse);
}

function main() {
  let server = new grpc.Server()
  server.addService(peer_proto.PeerMessagesService.service, {saveCertificate: saveCertificate, getCertificate: getCertificate, verifySignature: verifySignature, revokeCertificate: revokeCertificate, stop: stop})
  server.bind('192.168.70.7:60301', grpc.ServerCredentials.createInsecure())
  server.start()
}

main() // Initiate grpc server