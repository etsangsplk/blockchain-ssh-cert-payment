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
    channel_id: 'pointchannel',
    chaincode_id: 'chaincode_point',
    network_url: 'grpc://10.178.10.147:7051',
    event_url: 'grpc://10.178.10.147:7053',
    orderer_url: 'grpc://10.178.10.131:7050'
}

hbs.registerPartials(__dirname + '/views/partials')

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Transfer Point'
    })
})

app.get('/account', (req, res) => {
    res.render('account.hbs', {
        pageTitle: 'Account'
    })
})

app.get('/info?account=:accountNo', (req, res) => {
    console.log(req.params)
    bmt.query(options,
        'queryAccount', [req.params.accountNo]
    ).then((query_responses) => {
        console.log("returned from query ", query_responses)

        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            console.log("Parsed result: ", JSON.parse(query_responses))
            let result = JSON.parse(query_responses)
            res.render('account.hbs', {
                pageTitle: 'Account',
                accountNo: req.params.accountNo,
                accountType: result.accountType,
                issuerAccount: result.issuerAccount,
                accountAmount: result.amount,
            })
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
})

// app.post()

app.listen(3000, () => {
    console.log('Server is up on port 3000')
})