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
    channel_id: 'pointchannel',
    chaincode_id: 'chaincode_point',
    network_url: 'grpc://10.178.10.147:7051',
    endorser_url: ['grpc://10.178.10.162:7051',
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
    event_url: 'grpc://10.178.10.147:7053',
    orderer_url: 'grpc://10.178.10.131:7050'
}

// test only
/*
function payPoint(call, callback) {
    let channel = {}
    let client = null
    let targets = []
    let tx_id = null
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
        let fcn = 'pay'
        let args = [call.request.transactionId,
            call.request.fromAccountNo,
            call.request.toAccountNo,
            '90000' // transactionAmount
        ]
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
        callback(null, data)
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
    })
}
*/

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

// Create Account by 1000 sets
function createAccounts(call, callback) {
    let data = {
        result: false,
        errorMsg: ''
    }
    bmt.invoke(options,
        'createAccounts', [call.request.accountSets]
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
        resultMessage: ''
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
        createAccounts: createAccounts,
        payPoint: payPoint
    })
    return server;
}

let routeServer = getServer()
routeServer.bind('localhost:60302', grpc.ServerCredentials.createInsecure())
routeServer.start()