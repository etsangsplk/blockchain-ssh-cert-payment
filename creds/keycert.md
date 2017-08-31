You need to get private key and signcert to access fabric blockchain channel.

It usually located under crypto-config.

crypto-config/peerOrganization/users/Admin@domain.com/msp/keystore

crypto-config/peerOrganization/users/Admin@domain.com/msp/signcert

The private key's permission level need to be changed. 644 recommended.

Change the key file name from *_sk to *-priv.

```shell
chmod 644 {keyname}
```

Create directory at root location, name it as '.hfc-key-store'

Locate the key file under the .hfc-key-store folder.

Create JSON user file like [this](https://github.com/reoim/blockchain-bmt/blob/master/creds/PeerAdmin)

Replace signingIdentity value as private key name without '-priv'.

Replace cert value as new cert from signcert folder.

