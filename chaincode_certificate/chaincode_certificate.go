/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

//WARNING - this chaincode's ID is hard-coded in chaincode_example04 to illustrate one way of
//calling chaincode from a chaincode. If this example is modified, chaincode_example04.go has
//to be modified as well with the new ID of chaincode_example02.
//chaincode_example05 show's how chaincode ID can be passed in as a parameter instead of
//hard-coding.

import (
	"encoding/json"
	"fmt"
	_"strconv"
	"crypto"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"encoding/hex"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type Certificate struct {
	SerialNo string `json:"serialNo"`
	Issuer string `json:"issuer"`
	ResidentNo string `json:"residentNo"`
	PublicKey string `json:"publicKey"`
	StartDate string `json:"startDate"` 
	EndDate string `json:"endDate"`
	FileCertificate string `json:"fileCertificate"`
	Status string `json:"status"`
}

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Init")
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Invoke")
	function, args := stub.GetFunctionAndParameters()
	if function == "create" {
		// create certificate in the blockchain
		return t.create(stub, args)
	} else if function == "query" {
		// query certificate
		return t.query(stub, args)
	} else if function == "checkValidation" {
		// check validation upon logon
		return t.checkValidation(stub, args)
	} else if function == "discard" {
		// discard certificate
		return t.discard(stub, args)	
	}

	return shim.Error("Invalid invoke function name. Expecting \"create\" \"query\" \"checkValidation\" \"discard\"")
}

func (t *SimpleChaincode) create(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
//	var certInBytes = []byte(args[0])
	var cert Certificate
	var result string
/*
	err = json.Unmarshal(certInBytes, &cert)
	if err != nil {
		return shim.Error(err.Error())
	}
	serialNo = cert.SerialNo
	cert.Status = "0"
*/

	cert.SerialNo = args[0]
	cert.Issuer = args[1]
	cert.ResidentNo = args[2]
	cert.PublicKey = args[3]
	cert.StartDate = args[4]
	cert.EndDate = args[5]
	cert.FileCertificate = args[6]
	cert.Status = "0"

	certOutBytes, err := json.Marshal(cert)
	if err != nil {
		fmt.Println("marshal - error")
		return shim.Error(err.Error())	
	}
	err = stub.PutState(cert.SerialNo, certOutBytes)
	if err != nil {
		fmt.Println("putstate - error")
		return shim.Error(err.Error())
	}

	fmt.Println("creation successful")
	result = "Y"
	return shim.Success([]byte(result))
}

func (t *SimpleChaincode) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var serialNo string
	serialNo = args[0]

	certAsBytes, err := stub.GetState(serialNo)
	if err != nil {
		fmt.Println("getstate - error")
		return shim.Error(err.Error())
	}

	return shim.Success(certAsBytes)
}

func (t *SimpleChaincode) checkValidation(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var serialNo, signedResidentNo, curDate string
	var residentNo, publicKey, startDate, endDate, status string
	var cert Certificate
	var result string

	serialNo = args[0]
	signedResidentNo = args[1]
	curDate = args[2]

	certAsBytes, err := stub.GetState(serialNo)
	if err != nil {
		result = "getstate - no certificate"
		fmt.Println(result)
		return shim.Error(result)
	}
	err = json.Unmarshal(certAsBytes, &cert)
	if err != nil {
		result = "unmarshal - no certificate"
		fmt.Println(result)
		return shim.Error(result)
	}

	residentNo = cert.ResidentNo
	publicKey = cert.PublicKey
	startDate = cert.StartDate
	endDate = cert.EndDate
	status = cert.Status

/*
	//verify options
	var opts rsa.PSSOptions
	opts.SaltLength = rsa.PSSSaltLengthAuto // for simple example

	//parse public key
	block, _ := pem.Decode([]byte(publicKey))
	if block == nil || block.Type != "PUBLIC KEY" {
		return shim.Error(err.Error())
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	//verify Signature
	err = rsa.VerifyPSS(pub.(*rsa.PublicKey), crypto.SHA256, []byte(residentNo), []byte(signedResidentNo), &opts)
*/
	str := verifyPublicKey(publicKey, residentNo, signedResidentNo)

	if str == "Y" {
		if curDate >= startDate && curDate <= endDate {
			if status == "0" {
				result = "Y"
			} else {
				result = "discarded certificate"
				fmt.Println(result)
				return shim.Error(result)
			}
		} else {
			result = "expired certificate"
			fmt.Println(result)
			return shim.Error(result)
		}
	} else {
		result = "no valid certificate for the request"
		fmt.Println(result)
		return shim.Error(result)
	}

	result = "Y"
	return shim.Success([]byte(result))
}

func (t *SimpleChaincode) discard(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var serialNo, signedResidentNo string
	var residentNo, publicKey, status string
	var cert Certificate
	var result string

	serialNo = args[0]
	signedResidentNo = args[1]

	certAsBytes, err := stub.GetState(serialNo)
	if err != nil {
		result = "getstate - no certificate"
		fmt.Println(result)
		return shim.Error(result)
	}
	err = json.Unmarshal(certAsBytes, &cert)
	if err != nil {
		result = "unmarshal - no certificate"
		fmt.Println(result)
		return shim.Error(result)
	}	

	residentNo = cert.ResidentNo
	publicKey = cert.PublicKey
	status = cert.Status

	str := verifyPublicKey(publicKey, residentNo, signedResidentNo)

	if str == "Y" {
		if status == "0" {
			cert.Status = "1"

			certOutBytes, err := json.Marshal(cert)
			if err != nil {
				result = "marshal - error"
				fmt.Println(result)
				return shim.Error(result)
			}

			err = stub.PutState(serialNo, certOutBytes)
			if err != nil {
				result = "putstate - error"
				fmt.Println(result)
				return shim.Error(result)
			}
			result = "Y"
		} else {
			result = "certificate already discarded"
			fmt.Println(result)
			return shim.Error(result)
		}
	} else {
		result = str
	}

	return shim.Success([]byte(result))
}

func verifyPublicKey(publicKey string, residentNo string, signedResidentNo string) (str string) {
	//verify options
	var opts rsa.PSSOptions
	opts.SaltLength = rsa.PSSSaltLengthAuto // for simple example

	//parse public key
	block, _ := pem.Decode([]byte(publicKey))
	if block == nil || block.Type != "PUBLIC KEY" {
		str = "not valid public key block"
		fmt.Println(str)
		return str
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		str = "parsing error"
		fmt.Println(str)
		return str
	}

	decoded, err := hex.DecodeString(signedResidentNo)
	if err != nil {
		str = "hex.DecodeString error"
		fmt.Println(str)
		return str
	}

	//verify Signature
	err = rsa.VerifyPSS(pub.(*rsa.PublicKey), crypto.SHA256, []byte(residentNo), decoded, &opts)
	if err == nil {
		str = "Y"
	} else {
		str = "verification failed"
		fmt.Println(str)
		return str
	}

	return str
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
