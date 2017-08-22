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
    // 10.178.10.131    orderer0.kfbbmt.com
    // 10.178.10.137    orderer1.kfbbmt.com
    // 10.178.10.140    orderer2.kfbbmt.com
    // 10.178.10.147    peer0.bank.kfbbmt.com
    // 10.178.10.162    peer1.bank.kfbbmt.com
    // 10.178.10.177    peer2.bank.kfbbmt.com
    // 10.178.10.181    peer3.bank.kfbbmt.com
    // 10.178.10.183    peer4.bank.kfbbmt.com
    // 10.178.10.184    peer5.bank.kfbbmt.com
    // 10.178.10.187    peer6.bank.kfbbmt.com
    // 10.178.10.185    peer7.bank.kfbbmt.com
    // 10.178.195.190    peer8.bank.kfbbmt.com
    // 10.178.195.131    peer9.bank.kfbbmt.com
    // 10.178.195.134    peer10.bank.kfbbmt.com
    // 10.178.195.141    peer11.bank.kfbbmt.com
    // 10.178.195.142    peer12.bank.kfbbmt.com
    // 10.178.195.239    peer13.bank.kfbbmt.com
    // 10.178.195.148    peer14.bank.kfbbmt.com
    // 10.178.195.149    peer15.bank.kfbbmt.com
    // 10.178.195.150    peer16.bank.kfbbmt.com
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

// test only
// function saveCertificates(call, callback) {
//     let channel = {}
//     let client = null
//     let targets = []
//     let tx_id = null
//     let data = {
//         result: true,
//         errorMsg: ''
//     }
//     Promise.resolve().then(() => {
//         console.log("Create a client and set the wallet location")
//         client = new hfc()
//         return hfc.newDefaultKeyValueStore({ path: options.wallet_path })
//     }).then((wallet) => {
//         console.log("Set wallet path, and associate user ", options.user_id, " with application")
//         client.setStateStore(wallet)
//         return client.getUserContext(options.user_id, true)
//     }).then((user) => {
//         console.log("Check user is enrolled, and set a query URL in the network")
//         if (user === null) {
//             console.error("User not defined, or not enrolled - error")
//             data.result = false
//             data.errorMsg = 'User not defined, or not enrolled - error'
//         }
//         channel = client.newChannel(options.channel_id)
//         let peerObj = client.newPeer(options.network_url)
//         channel.addPeer(peerObj)
//         channel.addOrderer(client.newOrderer(options.orderer_url))
//         targets.push(peerObj)
//         callback(null, data)
//         return
//     }).catch((err) => {
//         data.result = false
//         data.errorMsg = err
//         callback(null, data)
//         console.error("Caught Error", err)
//     })
// }

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

function saveCertificates(call, callback) {
    let data = {
            result: false,
            errorMsg: ''
        }
        /*
            let channel = {}
            let client = null
            let targets = []
            let tx_id = null
            let clientPromise = new Promise((resolve, reject) => {
                if (client != null) {
                    reject('test purpose only')
                } else {
                    resolve()
                }
            })
            clientPromise.then(() => {
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
                let peerObj = client.newPeer(options.network_url)
                channel.addPeer(peerObj)
                channel.addOrderer(client.newOrderer(options.orderer_url))
                targets.push(peerObj)
                options.endorser_url.forEach((endorser) => {
                    targets.push(client.newPeer(endorser))
                })
                return
            }).then(() => {
                tx_id = client.newTransactionID()
                console.log("Assigning transaction_id: ", tx_id._transaction_id)
                let fcn = 'createCertificates'
                let args = [call.request.certificateSets]
                console.log('query fcn: ', fcn)
                console.log('query args: ', args)

                // send proposal to endorser
                let request = {
                    targets: targets,
                    chaincodeId: options.chaincode_id,
                    fcn: fcn,
                    args: args,
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
                        let result = results[0]
                        result.payload = proposalResponses[0].response.payload
                        return result // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
                    }).catch((err) => {
                        console.error(
                            'Failed to send transaction and get notifications within the timeout period.'
                        )
                        return 'Failed to send transaction and get notifications within the timeout period.'
                    })
                } else {
                    console.error(
                        'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
                    )
                    return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
                }
            }).then((response) => {
                console.log("invoke response: ", response)
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
                console.error("Caught Error :", err)
            })
        */
    bmt.invoke(options,
        'createCertificates', [call.request.certificateSets]
    ).then((response) => {
        console.log("invoke response: ", response)
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
        console.log("returned from query")
        let result = new Buffer(query_responses[0]).toString('ascii')
        console.log('query response: ', new Buffer(query_responses[0]).toString('ascii'))
        if (result === 'Y') {
            console.log('Successfully verify the signature')
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