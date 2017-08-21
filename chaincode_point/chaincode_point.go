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
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type Accounts struct {
	AccountSets []Account `json:"accountSets" `
}

type Account struct {
	AccountNo string `json:"accountNo"`
	AccountType string `json:"accountType"`
	IssuerAccount string `json:"issuerAccount"`
	Amount string `json:"amount"`
}

type Transaction struct {
	TransactionId string `json:"transactionId"`
	TransactionDate string `json:"transactionDate"`
	FromAccountNo string `json:"fromAccountNo"`
	ToAccountNo string `json:"toAccountNo"`
	Amount string `json:"amount"`
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
	if function == "createAccount" {
		// create an account in the blockchain
		return t.createAccount(stub, args)
	} else if function == "createAccounts" {
		// query an account
		return t.createAccounts(stub, args)
	} else if function == "queryAccount" {
		// query an account
		return t.queryAccount(stub, args)
	} else if function == "queryTransaction" {
	// transfer point from a partner account to a bank account
		return t.queryTransaction(stub, args)
/*
	} else if function == "charge" {
		// tranfer point from a bank account to a customer account
		return t.charge(stub, args)
*/
	} else if function == "pay" {
		// tranfer point from a customer account to a partner account
		return t.pay(stub, args)
/*
	} else if function == "refund" {
		// transfer point from a partner account to a bank account
		return t.refund(stub, args)
*/
	}

	return shim.Error("Invalid invoke function name. Expecting \"createAccount\" \"createAccounts\" \"queryAccount\" \"queryTransaction\" \"pay\"")
}

func (t *SimpleChaincode) createAccounts(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var result string

	var accounts Accounts
	var accountsInBytes = []byte(args[0])	

	err = json.Unmarshal(accountsInBytes, &accounts)
	if err != nil {
		fmt.Println("accounts unmarshal error : " + err.Error())
		return shim.Error(err.Error())
	}

	accountSets := accounts.AccountSets

	for i := range accountSets {
	 	account := accountSets[i]
		accountOutBytes, err := json.Marshal(account)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = stub.PutState(account.AccountNo, accountOutBytes)
		if err != nil {
			return shim.Error(err.Error())
		}

		result = result + "account created : " + account.AccountNo + " -- "

		// create initial transaction
		var transaction Transaction

		transaction.TransactionId = "initial" + account.AccountNo
		transaction.TransactionDate = "initial"
		transaction.FromAccountNo = "intial"
		transaction.ToAccountNo = account.AccountNo
		transaction.Amount = account.Amount

		transactionOutBytes, err := json.Marshal(transaction)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = stub.PutState(transaction.TransactionId, transactionOutBytes)
		if err != nil {
			return shim.Error(err.Error())
		}

		// composite key creation
		indexName := "toaccountno~transactionid"
		indexKey, err := stub.CreateCompositeKey(indexName, []string{account.AccountNo, transaction.TransactionId})
		if err != nil {
			return shim.Error(err.Error())
		}
		value := []byte{0x00}
		stub.PutState(indexKey, value)

		result = result + "transaction (initial) : " + account.Amount + " to " + account.AccountNo + " -- "

	}

	fmt.Println(result)

	return shim.Success([]byte(result))
}

func (t *SimpleChaincode) createAccount(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var account Account
	var amount string
	var result string

	account.AccountNo = args[0]
	account.AccountType = args[1]
	account.IssuerAccount = args[2]
	account.Amount = "0"
	amount = args[3]

	accountOutBytes, err := json.Marshal(account)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(account.AccountNo, accountOutBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	result = result + "account created : " + account.AccountNo + " -- "

	// create initial transaction
	var transaction Transaction

	transaction.TransactionId = "initial" + account.AccountNo
	transaction.TransactionDate = "initial"
	transaction.FromAccountNo = "intial"
	transaction.ToAccountNo = account.AccountNo
	transaction.Amount = amount

	transactionOutBytes, err := json.Marshal(transaction)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(transaction.TransactionId, transactionOutBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	// composite key creation
	indexName := "toaccountno~transactionid"
	indexKey, err := stub.CreateCompositeKey(indexName, []string{account.AccountNo, transaction.TransactionId})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := []byte{0x00}
	stub.PutState(indexKey, value)


	result = result + "transaction (initial) : " + amount + " to " + account.AccountNo + " -- "
	fmt.Println(result)

	return shim.Success([]byte(result))
}

func (t *SimpleChaincode) queryAccount(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("queryAccount")
	var err error
	var accountNo string
	var account Account

	accountNo = args[0]
	fmt.Println("account no : " + accountNo)

	accountAsBytes, err := stub.GetState(accountNo)
	if err != nil {
		fmt.Println("getstate error : " + err.Error())
		return shim.Error(err.Error())
	}

	err = json.Unmarshal(accountAsBytes, &account)
	if err != nil {
		fmt.Println("unmarshal error : " + err.Error())
		return shim.Error(err.Error())
	}

	fmt.Println("queryAccountAmount")
	account.Amount = t.queryAccountAmount(stub, accountNo)

	accountOutBytes, err := json.Marshal(account)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("json returning")
	return shim.Success(accountOutBytes)
}

func (t *SimpleChaincode) queryTransaction(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("queryTransaction")
	var err error
	var transactionId string
//	var account Account

	transactionId = args[0]
	fmt.Println("transaction id : " + transactionId)

	transactionAsBytes, err := stub.GetState(transactionId)
	if err != nil {
		fmt.Println("getstate error : " + err.Error())
		return shim.Error(err.Error())
	}

/*
	err = json.Unmarshal(accountAsBytes, &account)
	if err != nil {
		fmt.Println("unmarshal error : " + err.Error())
		return shim.Error(err.Error())
	}

	fmt.Println("queryAccountAmount")
	account.Amount = t.queryAccountAmount(stub, accountNo)

	accountOutBytes, err := json.Marshal(account)
	if err != nil {
		return shim.Error(err.Error())
	}
*/
	fmt.Println("json returning")
//	return shim.Success(accountOutBytes)
	return shim.Success(transactionAsBytes)
}


func (t *SimpleChaincode) pay(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	var transactionDate, customerAccountNo, partnerAccountNo, amount string
	var customerAccount Account
	var partnerAccount Account
//	var customerBankAccount Account
//	var partnerBankAccount Account
	var transaction Transaction
	var result string

	transactionDate = args[0]
	customerAccountNo = args[1]
	partnerAccountNo = args[2]
	amount = args[3]

	// check customer account amount
	customerAccountAmount,_ := strconv.Atoi(t.queryAccountAmount(stub, customerAccountNo))
	transactionAmount,_ := strconv.Atoi(amount)
	var chargingAmount = 1200000
	if customerAccountAmount-transactionAmount < 0 {
		// charge

		// query customer account
		accountAsBytes, err := stub.GetState(customerAccountNo)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = json.Unmarshal(accountAsBytes, &customerAccount)
		if err != nil {
			return shim.Error(err.Error())
		}

		// create transactions
		var chargingTransaction Transaction

		chargingTransaction.TransactionId = transactionDate + customerAccount.IssuerAccount + customerAccountNo
		chargingTransaction.TransactionDate = transactionDate
		chargingTransaction.FromAccountNo = customerAccount.IssuerAccount
		chargingTransaction.ToAccountNo = customerAccountNo
		chargingTransaction.Amount = strconv.Itoa(chargingAmount)

		transactionOutBytes, err := json.Marshal(chargingTransaction)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = stub.PutState(chargingTransaction.TransactionId, transactionOutBytes)
		if err != nil {
			return shim.Error(err.Error())
		}		

		// composite key creation
		indexName := "fromaccountno~transactionid"
		indexKey, err := stub.CreateCompositeKey(indexName, []string{customerAccount.IssuerAccount, chargingTransaction.TransactionId})
		if err != nil {
			return shim.Error(err.Error())
		}
		value := []byte{0x00}
		stub.PutState(indexKey, value)

		indexName = "toaccountno~transactionid"
		indexKey, err = stub.CreateCompositeKey(indexName, []string{customerAccountNo, chargingTransaction.TransactionId})
		if err != nil {
			return shim.Error(err.Error())
		}
		value = []byte{0x00}
		stub.PutState(indexKey, value)


		result = result + "transaction (charge) : " + strconv.Itoa(chargingAmount) + " transfered from " + customerAccount.IssuerAccount + " to " + customerAccountNo + " -- "
	}

	// create transactions
	transaction.TransactionId = transactionDate + customerAccountNo + partnerAccountNo
	transaction.TransactionDate = transactionDate
	transaction.FromAccountNo = customerAccountNo
	transaction.ToAccountNo = partnerAccountNo
	transaction.Amount = amount

	transactionOutBytes, err := json.Marshal(transaction)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(transaction.TransactionId, transactionOutBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	// composite key creation
	indexName := "fromaccountno~transactionid"
	indexKey, err := stub.CreateCompositeKey(indexName, []string{customerAccountNo, transaction.TransactionId})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := []byte{0x00}
	stub.PutState(indexKey, value)

	indexName = "toaccountno~transactionid"
	indexKey, err = stub.CreateCompositeKey(indexName, []string{partnerAccountNo, transaction.TransactionId})
	if err != nil {
		return shim.Error(err.Error())
	}
	value = []byte{0x00}
	stub.PutState(indexKey, value)

	result = result + "transaction (pay) : " + strconv.Itoa(transactionAmount) + " transfered from " + customerAccountNo + " to " + partnerAccountNo + " -- "
	
	// check partner account amount
	partnerAccountAmount,_ := strconv.Atoi(t.queryAccountAmount(stub, partnerAccountNo))

	// refund ----------------------- optional
	// check partner account amount
	var refundAmount = 500000000
	if partnerAccountAmount >= refundAmount {
		// charge

		// query partner account
		accountAsBytes, err := stub.GetState(partnerAccountNo)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = json.Unmarshal(accountAsBytes, &partnerAccount)
		if err != nil {
			return shim.Error(err.Error())
		}

		// create transactions
		var refundTransaction Transaction

		refundTransaction.TransactionId = transactionDate + partnerAccountNo + partnerAccount.IssuerAccount
		refundTransaction.TransactionDate = transactionDate
		refundTransaction.FromAccountNo = partnerAccountNo
		refundTransaction.ToAccountNo = partnerAccount.IssuerAccount
		refundTransaction.Amount = strconv.Itoa(refundAmount)

		transactionOutBytes, err := json.Marshal(refundTransaction)
		if err != nil {
			return shim.Error(err.Error())
		}
		err = stub.PutState(refundTransaction.TransactionId, transactionOutBytes)
		if err != nil {
			return shim.Error(err.Error())
		}		

		// composite key creation
		indexName := "fromaccountno~transactionid"
		indexKey, err := stub.CreateCompositeKey(indexName, []string{partnerAccountNo, refundTransaction.TransactionId})
		if err != nil {
			return shim.Error(err.Error())
		}
		value := []byte{0x00}
		stub.PutState(indexKey, value)

		indexName = "toaccountno~transactionid"
		indexKey, err = stub.CreateCompositeKey(indexName, []string{partnerAccount.IssuerAccount, refundTransaction.TransactionId})
		if err != nil {
			return shim.Error(err.Error())
		}
		value = []byte{0x00}
		stub.PutState(indexKey, value)

		result = result + "transaction (refund) : " + strconv.Itoa(refundAmount) + " transfered from " + partnerAccountNo + " to " + partnerAccount.IssuerAccount + " -- "
	}

	return shim.Success([]byte(result))
}

func (t *SimpleChaincode) queryAccountAmount(stub shim.ChaincodeStubInterface, accountNo string) (amount string) {

	var amountPlus = 0
	var amountMinus = 0

	fromAccountIterator, err := stub.GetStateByPartialCompositeKey("fromaccountno~transactionid", []string{accountNo})
	if err != nil {
		return err.Error()
	}
	defer fromAccountIterator.Close()

	var i int
	for i = 0; fromAccountIterator.HasNext(); i++ {
		responseRange, err := fromAccountIterator.Next()
		if err != nil {
			return err.Error()
		}

		objectType, compositeKeyParts, err := stub.SplitCompositeKey(responseRange.Key)
		if err != nil {
			return err.Error()
		}
		returnedAccountNo := compositeKeyParts[0]
		transactionId := compositeKeyParts[1]
		fmt.Printf("- found a from-transaction index:%s accountNo:%s transactionId:%s\n", objectType, returnedAccountNo, transactionId)

		// query transaction ammount
		var transaction Transaction
		transactionAsBytes, err := stub.GetState(transactionId)
		if err != nil {
			return err.Error()
		}
		err = json.Unmarshal(transactionAsBytes, &transaction)
		if err != nil {
			return err.Error()		
		}
		transactionAmount,_ := strconv.Atoi(transaction.Amount)
		amountMinus += transactionAmount
	}

	toAccountIterator, err := stub.GetStateByPartialCompositeKey("toaccountno~transactionid", []string{accountNo})
	if err != nil {
		return err.Error()
	}
	defer toAccountIterator.Close()

	for i = 0; toAccountIterator.HasNext(); i++ {
		responseRange, err := toAccountIterator.Next()
		if err != nil {
			return err.Error()
		}

		objectType, compositeKeyParts, err := stub.SplitCompositeKey(responseRange.Key)
		if err != nil {
			return err.Error()
		}
		returnedAccountNo := compositeKeyParts[0]
		transactionId := compositeKeyParts[1]
		fmt.Printf("- found a to-transaction index:%s accontNo:%s transactionId:%s\n", objectType, returnedAccountNo, transactionId)

		// query transaction ammount
		var transaction Transaction
		transactionAsBytes, err := stub.GetState(transactionId)
		if err != nil {
			return err.Error()
		}
		err = json.Unmarshal(transactionAsBytes, &transaction)
		if err != nil {
			return err.Error()		
		}
		transactionAmount,_ := strconv.Atoi(transaction.Amount)
		amountPlus += transactionAmount
	}

	amount = strconv.Itoa(amountPlus-amountMinus)

	return amount
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
