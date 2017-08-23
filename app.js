const express = require('express')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const hbs = require('hbs')
const hfc = require('fabric-client')
const path = require('path')
const util = require('util')
const grpc = require('grpc')
const bmt = require('./bmt/bmt')

let app = express()
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

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

hbs.registerPartials(__dirname + '/views/partials')

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Transfer Point'
    })
})

app.get('/transfer', (req, res) => {
    res.render('transfer.hbs', {
        pageTitle: 'Transfer Point'
    })
})

app.get('/account', (req, res) => {
    res.render('account.hbs', {
        pageTitle: 'Account'
    })
})

app.get('/info', (req, res) => {
    console.log('query parameter: ', req.query.account)
    bmt.query(options,
        'queryAccount', [req.query.account]
    ).then((query_responses) => {
        console.log("returned from query ", query_responses)

        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            console.log("Parsed result: ", JSON.parse(query_responses))
            let result = JSON.parse(query_responses)
            res.render('info.hbs', {
                pageTitle: 'Account',
                accountNo: req.query.account,
                accountType: result.accountType,
                issuerAccount: result.issuerAccount,
                accountAmount: result.amount,
            })
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
})

app.post('/transferpoint', (req, res) => {
    let transactionId = uuidv4()
    bmt.invoke(options,
        'pay', [transactionId,
            req.body.fromAccount,
            req.body.toAccount,
            req.body.amount
        ]
    ).then((response) => {
        console.log('create response: ', response)
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.')
            res.redirect('/transfer')
        } else {
            console.error('Failed to order the transaction.')
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
})

app.listen(3333, () => {
    console.log('Server is up on port 3333')
})