const express = require('express')
const hbs = require('hbs')
const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = require('grpc')
const bmt = require('./bmt/bmt')

let app = express()

let options = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'chncert',
    chaincode_id: 'chaincode_point',
    network_url: 'grpc://10.178.10.173:7051',
    // endorser_url: [],
    event_url: 'grpc://10.178.10.173:7053',
    orderer_url: 'grpc://10.178.10.182:7050'
}

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Home Page',
        name: 'Reo',
    })
})

app.get('/account/:accountNo', (req, res) => {
    console.log(req.params)
    let result = queryAccount(req.params)
    res.render()
})

function queryAccount(req) {
    bmt.query(options,
        'queryAccount', [req.accountNo]
    ).then((query_responses) => {
        console.log("returned from query")

        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))
            return JSON.parse(query_responses)
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
}

function queryTransaction(req) {
    bmt.query(options,
        'queryTransaction', [req.transactionId]
    ).then((query_responses) => {
        console.log("returned from query")

        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))
            return JSON.parse(query_responses)
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
}


app.listen(3000, () => {
    console.log('Server is up on port 3000')
})