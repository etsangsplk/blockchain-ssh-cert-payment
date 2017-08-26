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
        network_url: '',
        endorser_url: [
            'grpc://10.178.10.147:7051',
            'grpc://10.178.10.162:7051',
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
        event_url: '',
        orderer_url: 'grpc://10.178.10.131:7050'
    }
    //grpc://10.178.10.189:7051
let ranNum = Math.floor(Math.random() * options.endorser_url.length)
    // Set network url randomly from endorsers (default port: 7051)
    // options.network_url = 'grpc://10.178.10.189:7051' // 은행연합회 노드
options.network_url = options.endorser_url[ranNum]
    // Remove networkurl from endorser url
options.endorser_url.splice(ranNum, 1)
    // Set event hub url as same ip with network url and 7053 port
options.event_url = options.network_url.substring(0, options.network_url.length - 1) + '3'

let certOptions = Object.create(options)
certOptions.channel_id = 'certificatechannel'
certOptions.chaincode_id = 'chaincode_certificate'

let pointOptions = Object.create(options)
pointOptions.channel_id = 'pointchannel'
pointOptions.chaincode_id = 'chaincode_point'

hbs.registerPartials(__dirname + '/views/partials')

app.get('/', (req, res) => {
    res.render('cert.hbs', {
        pageTitle: '인증정보 조회'
    })
})

app.get('/cert', (req, res) => {
    if (req.query.certNo === undefined) {
        res.render('cert.hbs', {
            pageTitle: '인증정보 조회',
            endorserList: options.endorser_url
        })
    } else {
        console.log('query parameter: ', req.query.certNo)
        bmt.query(certOptions,
            'query', [req.query.certNo]
        ).then((query_responses) => {
            console.log("returned from query ", query_responses)

            if (query_responses[0] instanceof Error) {
                console.error("error from query = ", query_responses[0])
            } else if (!query_responses.length) {
                console.log("No payloads were returned from query")
            } else {
                console.log("Parsed result: ", JSON.parse(query_responses))
                let result = JSON.parse(query_responses)
                res.render('cert.hbs', {
                    pageTitle: '인증 정보',
                    serialNo: req.query.serialNo,
                    issuer: req.query.issuer,
                    residentNo: req.query.residentNo,
                    publicKey: req.query.publicKey,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                    certificate: fileCertificate,
                    status: req.qeury.status

                })
            }
        }).catch((err) => {
            console.error("Caught Error", err)
        })
    }
})

app.get('/transfer', (req, res) => {
    res.render('transfer.hbs', {
        pageTitle: '지급 결제'
    })
})

app.get('/account', (req, res) => {
    if (req.query.account === undefined) {
        res.render('account.hbs', {
            pageTitle: '계좌 조회'
        })
    } else {
        console.log('query parameter: ', req.query.account)
        bmt.query(pointOptions,
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
                res.render('acount.hbs', {
                    pageTitle: '계좌 조회',
                    accountNo: req.query.account,
                    accountType: result.accountType,
                    issuerAccount: result.issuerAccount,
                    accountAmount: result.amount,
                })
            }
        }).catch((err) => {
            console.error("Caught Error", err)
        })

    }

})

// app.get('/certinfo', (req, res) => {
//     console.log('query parameter: ', req.query.certNo)
//     bmt.query(certOptions,
//         'query', [req.query.certNo]
//     ).then((query_responses) => {
//         console.log("returned from query ", query_responses)

//         if (query_responses[0] instanceof Error) {
//             console.error("error from query = ", query_responses[0])
//         } else if (!query_responses.length) {
//             console.log("No payloads were returned from query")
//         } else {
//             console.log("Parsed result: ", JSON.parse(query_responses))
//             let result = JSON.parse(query_responses)
//             res.render('certinfo.hbs', {
//                 pageTitle: '인증 정보'
//             })
//         }
//     }).catch((err) => {
//         console.error("Caught Error", err)
//     })
// })

/*
app.get('/account', (req, res) => {
    console.log('query parameter: ', req.query.account)
    bmt.query(pointOptions,
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
*/

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