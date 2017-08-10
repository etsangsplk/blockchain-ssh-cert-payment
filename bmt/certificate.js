'use strict'

const hfc = require('fabric-client')
const path = require('path')
const util = require('util')

function createCertificate(options, call) {
    return Promise.resolve().then(() => {
        console.log("Create a client and set the wallet location")
        client = new hfc()
        return hfc.newDefaultKeyValueStore({ path: options.wallet_path })
    }).then((wallet) => {
        console.log("Set wallet path, and associate user ", options.user_id, " with application")
        client.setStateStore(wallet)
        return client.getUserContext(options.user_id, true)
    }).then((user) => {
        console.log("Check user is enrolled, and set a query URL in the network")
        if (user === undefined || user.isEnrolled() === false) {
            console.error("User not defined, or not enrolled - error")
        }
        channel = client.newChannel(options.channel_id)
        channel.addPeer(client.newPeer(options.peer_url))
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
            args: [ request.call.serialNo,
                    request.call.certificate,
                    request.call.hashedSsn,
                    request.call.status,
                    request.call.notBefore,
                    request.call.notAfter
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
            console.log('transaction proposal was good')
        } else {
            console.error('transaction proposal was bad')
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
                        console.error(
                            'The transaction was invalid, code = ' + code)
                        reject()
                    } else {
                        console.log(
                            'The transaction has been committed on peer ' +
                            eh._ep._endpoint.addr)
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
                return 'Failed to send transaction and get notifications within the timeout period.'
            })
        } else {
            console.error(
                'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
            )
            return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
        }
    }, (err) => {
        console.error('Failed to send proposal due to error: ' + err.stack ? err.stack :
            err)
        return 'Failed to send proposal due to error: ' + err.stack ? err.stack :
            err
    })
}

function queryCertificate(options, call) {
    return Promise.resolve().then(() => {
        console.log("Create a client and set the wallet location")
        client = new hfc()
        return hfc.newDefaultKeyValueStore({ path: options.wallet_path })
    }).then((wallet) => {
        console.log("Set wallet path, and associate user ", options.user_id, " with application")
        client.setStateStore(wallet)
        return client.getUserContext(options.user_id, true)
    }).then((user) => {
        console.log("Check user is enrolled, and set a query URL in the network")
        if (user === undefined || user.isEnrolled() === false) {
            console.error("User not defined, or not enrolled - error")
        }
        channel = client.newChannel(options.channel_id)
        channel.addPeer(client.newPeer(options.peer_url))
        return
    }).then(() => {
        console.log("Make query")
        let transaction_id = client.newTransactionID();
        console.log("Assigning transaction_id: ", transaction_id._transaction_id);
        let request = {
            chaincodeId: userOptions.chaincode_id,
            txId: transaction_id,
            fcn: 'getCertificate',
            args: []
        };
        request.args.push(call.request.serialNo)
        return channel.queryByChaincode(request);
    })
}



module.exports = {
    createCertificate,
    queryCertificate
}