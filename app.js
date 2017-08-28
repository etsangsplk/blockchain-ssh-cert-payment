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
    orderer_url: 'grpc://10.178.10.189:7050'
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

function userAll(startNum) {
    let accNo = "00" + startNum
    bmt.query(pointOptions,
        'queryAccount', [accNo]
    ).then((query_responses) => {
        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            let result = JSON.parse(query_responses)
            console.log(result.accountNo + ',' + result.accountType + ',' + result.issuerAccount + ',' + result.amount)
        }
        return parseInt(startNum) + 1
    }).then((lastNum) => {
        if (lastNum === 310001) {
            return
        } else {
            userAll(lastNum)
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
}

function storeAll(startNum) {
    let accNo = "00" + startNum
    bmt.query(pointOptions,
        'queryAccount', [accNo]
    ).then((query_responses) => {
        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            let result = JSON.parse(query_responses)
            console.log(result.accountNo + ',' + result.accountType + ',' + result.issuerAccount + ',' + result.amount)
        }
        return parseInt(startNum) + 1
    }).then((lastNum) => {
        if (lastNum === 200501) {
            return
        } else {
            storeAll(lastNum)
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
}

function bankAll(startNum) {
    let accNo = "00" + startNum
    console.log('acc no:', accNo)
    bmt.query(pointOptions,
        'queryAccount', [accNo]
    ).then((query_responses) => {
        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            let result = JSON.parse(query_responses)
            console.log(result.accountNo + ',' + result.accountType + ',' + result.issuerAccount + ',' + result.amount)
        }
        return parseInt(startNum) + 1
    }).then((lastNum) => {
        if (lastNum === 100081) {
            return
        } else {
            bankAll(lastNum)
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
}

app.get('/', (req, res) => {
    res.render('cert.hbs', {
        pageTitle: '인증정보 조회'
    })
})

app.get('/cert', (req, res) => {
    if (req.query.serialNo === undefined) {
        res.render('cert.hbs', {
            pageTitle: '인증정보 조회'
        })
    } else {
        console.log('query parameter: ', req.query)
        if (req.query.selectOption === '은행연합회') {
            certOptions.network_url = 'grpc://10.178.10.189:7051'
        } else {
            certOptions.network_url = 'grpc://10.178.10.147:7051'
        }
        bmt.query(certOptions,
            'query', [req.query.serialNo]
        ).then((query_responses) => {
            if (query_responses[0] instanceof Error) {
                res.render('cert.hbs', {
                    pageTitle: '인증정보 조회'
                })
            } else if (!query_responses.length) {
                console.log("No payloads were returned from query")
                res.render('cert.hbs', {
                    pageTitle: '인증정보 조회'
                })
            } else {
                console.log("Parsed result: ", JSON.parse(query_responses))
                let result = JSON.parse(query_responses)
                res.render('cert.hbs', {
                    pageTitle: '인증 정보',
                    serialNo: result.serialNo,
                    issuer: result.issuer,
                    residentNo: result.residentNo,
                    publicKey: result.publicKey,
                    startDate: result.startDate,
                    endDate: result.endDate,
                    certificate: result.fileCertificate,
                    status: result.status
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
    } else if (req.query.type === "bank") {
        console.log('accountNo, accountType, issuerAccount, amount')
        userAll(req.query.num)
    } else if (req.query.type === "store") {
        console.log('accountNo, accountType, issuerAccount, amount')
        storeAll(req.query.num)
    } else if (req.query.type === "user") {
        console.log('accountNo, accountType, issuerAccount, amount')
        userAll(req.query.num)
    } else {
        console.log('query parameter: ', req.query.account)
        bmt.query(pointOptions,
            'queryAccount', [req.query.account]
        ).then((query_responses) => {
            if (query_responses[0] instanceof Error) {
                console.error("error from query = ", query_responses[0])
            } else if (!query_responses.length) {
                console.log("No payloads were returned from query")
            } else {
                console.log("계좌정보: ", JSON.parse(query_responses))
                let result = JSON.parse(query_responses)
                res.render('account.hbs', {
                    pageTitle: '계좌 조회',
                    accountNo: req.query.account,
                    accountType: result.accountType,
                    issuerAccount: result.issuerAccount,
                    accountAmount: result.amount
                })
            }
        }).catch((err) => {
            console.error("Caught Error", err)
        })

    }

})






app.post('/transferpoint', (req, res) => {
    let transactionId = uuidv4()
    bmt.invoke(pointOptions,
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
    // console.log('Server is up on port 3333')
})