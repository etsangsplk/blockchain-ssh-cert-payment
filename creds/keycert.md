You need to get private key and signcert to access fabric blockchain channel.

It usually located under crypto-config.

crypto-config/peerOrganization/users/Admin@domain.com/msp/keystore

crypto-config/peerOrganization/users/Admin@domain.com/msp/signcert

The private key's permission level need to be changed. 644 recommended.

```shell
chmod 644 {keyname}
```

Create 
