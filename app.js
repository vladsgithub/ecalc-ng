(function () {
    'use strict';
    angular.module('app', []);
})();

(function (module) {

    var calculatorCtrl = ['$scope', 'getDataService', function ($scope, getDataService) {

        // METHODS OF CREATING ===============================
        $scope.createAccount = function () {
            var accounts = $scope.expCalc.accounts;
            var accountIndex = accounts.length;
            var newAccount = {
                settings: {
                    accountCurrency: $scope.expCalc.settings.baseCurrency,
                    fixationDirectly: true
                },
                meta: {
                    title: 'Новый расчет', //'Новый расчет ' + accountIndex,
                    total: 0,
                    fullRefund: 0
                },
                participants: []
            };

            accounts.push(newAccount);

            $scope.createParticipant(accountIndex);
        };

        $scope.createParticipant = function (accountIndex) {
            // todo: probably rework this method - it could receive objects: account
            var participantIndex = $scope.expCalc.accounts[accountIndex].participants.length;
            var newParticipant = {
                meta: {
                    title: 'Участник ' + accountIndex + '.' + participantIndex,
                    participation: 1,
                    preferredCurrency: $scope.expCalc.settings.baseCurrency,
                    total: 0,
                    share: 0,
                    balance: 0,
                    receivedSum: 0,
                    givenSum: 0
                },
                expenses: [],
                fixation: {
                    whom: [],
                    byBank: [] // it will be added objects: { value: null, reserve: null, date: null} (participants can return money by some parts)
                }
            };

            $scope.expCalc.accounts[accountIndex].participants.push(newParticipant);

            $scope.addParticipantToPartList($scope.expCalc.accounts[accountIndex]);
        };






        // METHODS OF REMOVING ===============================
        $scope.removeAccount = function (obj) {
            $scope.expCalc.accounts.splice(obj.$index, 1);
        };

        $scope.removeParticipant = function (obj) {
            var accountIndex = obj.$parent.$parent.$index;
            var participantIndex = obj.$index;

            $scope.expCalc.accounts[accountIndex].participants.splice(participantIndex, 1);
            $scope.removeParticipantFromPartList($scope.expCalc.accounts[accountIndex], participantIndex);
        };

        $scope.removeExpense = function (obj) {
            var accountIndex = obj.$parent.$parent.$parent.$index;
            var participantIndex = obj.$parent.$index;
            var expenseIndex = obj.$index;

            $scope.expCalc.accounts[accountIndex].participants[participantIndex].expenses.splice(expenseIndex, 1);
        };

        $scope.removeParticipantFromPartList = function (account, participantIndex) {
            account.participants.forEach(function (participant, i, arr) {
                participant.expenses.forEach(function (expense, i, arr) {
                    expense.partList.splice(participantIndex, 1);
                });
            });
        };

        $scope.removePayment = function (debtor, refundIndex) {
            debtor.fixation.whom.splice(refundIndex, 1);
        };






        // METHODS OF ADDING ===============================
        $scope.addNewExpense = function (obj) {
            // todo: probably rework this method - it could receive objects: account, participant

            var accountIndex = obj.$parent.$parent.$index;
            var participantIndex = obj.$index;
            var expenseIndex = obj.participant.expenses.length;
            var newExpense = {
                title: 'Расход ' + accountIndex + '.' + participantIndex + '.' + expenseIndex,
                type: '0',
                date: '' + new Date(),
                value: null,
                currency: obj.$parent.$parent.account.settings.accountCurrency,
                partList: []
            };

            $scope.expCalc.accounts[accountIndex].participants.forEach(function (participant, i, arr) {
                newExpense.partList.push(true);
            });

            obj.participant.expenses.push(newExpense);
        };

        $scope.addParticipantToPartList = function (account) {
            account.participants.forEach(function (participant, i, arr) {
                participant.expenses.forEach(function (expense, i, arr) {
                    expense.partList.push(true);
                });
            });
        };

        $scope.addValueToParticipationLists = function (accountIndex, participantIndex) {
            $scope.expCalc.accounts[accountIndex].participants.forEach(function (item, i, arr) {
                item.participationList[participantIndex].push({
                    value: true,
                    share: null
                });
            });
        };

        $scope.addNewPayment = function(participant) {
            participant.fixation.whom.push({
                number: null,
                value: 0,
                currency: null,
                date: '' + new Date(),
                reserve: 0
            });
        };






        // METHODS OF GETTING ===============================
        $scope.getAccountCurrency = function() {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            return $scope.expCalc.settings.currencies.names[currentAccount.settings.accountCurrency];
        };

        $scope.getAccountTotal = function (account) {
            account.meta.total = 0;

            account.participants.forEach(function (participant, i, arr) {
                account.meta.total += participant.meta.total;
            });

            return account.meta.total;
        };

        $scope.getParticipantTotal = function (account, participant) {
            var rates = $scope.expCalc.settings.currencies.rates[account.settings.accountCurrency];

            participant.meta.total = 0;

            participant.expenses.forEach(function (expense, i, arr) {
                participant.meta.total += expense.value * rates[expense.currency];
            });

            return participant.meta.total;
        };

        $scope.getMoneyByAccountCurrency = function (value, exchangeCurrency) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                rate = $scope.expCalc.settings.currencies.rates[currentAccount.settings.accountCurrency][exchangeCurrency];

            return value * rate;
        };

        $scope.getMoneyByPrefferedCurrency = function (value, exchangeCurrency) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                rate = $scope.expCalc.settings.currencies.rates[currentAccount.settings.accountCurrency][exchangeCurrency];

            return value / rate;
        };

        $scope.getExpenseWithRate = function (expense) {
            return $scope.getMoneyByAccountCurrency(expense.value, expense.currency);
        };

        $scope.getPartSumOfExpense = function (account, expense) {
            var partSumOfExpense = 0;

            expense.partList.forEach(function (participation, i, arr) {
                if (participation) {
                    partSumOfExpense += account.participants[i].meta.participation;
                }
            });

            return partSumOfExpense;
        };

        $scope.getExpenseShare = function (account, expense, extParticipantIndex) {
            return expense.partList[extParticipantIndex] *
                account.participants[extParticipantIndex].meta.participation *
                $scope.getExpenseWithRate(expense) /
                $scope.getPartSumOfExpense(account, expense);
        };

        $scope.getParticipantShare = function (account, extParticipantIndex) {
            var participantShare = 0;

            account.participants.forEach(function (participant, i, arr) {
                participant.expenses.forEach(function (expense, i, arr) {
                    participantShare += $scope.getExpenseShare(account, expense, extParticipantIndex);
                });
            });

            account.participants[extParticipantIndex].meta.share = participantShare;

            return participantShare;
        };

        $scope.getShareTotal = function (account) {
            var shareTotal = 0;

            account.participants.forEach(function (participant, i, arr) {
                shareTotal += account.participants[i].meta.share;
            });

            return shareTotal;
        };

        $scope.getFullRefund = function (account) {
            var balance, fullRefund = 0;

            account.participants.forEach(function (participant, i, arr) {
                balance = participant.meta.total - participant.meta.share;
                fullRefund += (balance < 0) ? balance : 0;
            });

            account.meta.fullRefund = fullRefund;

            return fullRefund;
        };

        $scope.getBalance = function (participant) {
            participant.meta.balance = participant.meta.total - participant.meta.share;

            return participant.meta.balance;
        };

        $scope.getParticipantOption = function (sponsor, debtor) {
            var currencyNumber, option = sponsor.meta.title;

            if (debtor.meta.balance < 0 &&
                $scope.roundOff(sponsor.meta.balance - sponsor.meta.receivedSum) > 0 &&
                $scope.roundOff(debtor.meta.balance + debtor.meta.givenSum) < 0) {

                currencyNumber = $scope.getRest(sponsor, debtor).currency;
                option += ' - [' + $scope.expCalc.settings.currencies.names[currencyNumber].toUpperCase() + ' ' +
                    $scope.getRest(sponsor, debtor).rest + ']';
            }

            return option;
        };

        $scope.getReceivedSum = function (account, participant, participantIndex) {
            participant.meta.receivedSum = 0;
// console.log('-----------', participant.meta.title);
            account.participants.forEach(function(person, i, arr) {
                person.fixation.whom.forEach(function(refund, n, arr) {
                    if (participantIndex == refund.number && refund.number !== null && refund.currency !== null) {
// console.log(participant.meta.receivedSum , ' += ', $scope.getMoneyByAccountCurrency(refund.value, refund.currency));
                        participant.meta.receivedSum += $scope.roundOff($scope.getMoneyByAccountCurrency(refund.value, refund.currency), true);
// console.log('++++++++++++++++receivedSum = ', participant.meta.receivedSum);
                    }
                });
            });
// console.log('participant.meta.receivedSum = ', participant.meta.receivedSum);
            participant.meta.receivedSum = $scope.roundOff(participant.meta.receivedSum);

            return participant.meta.receivedSum;
        };

        $scope.getGivenSum = function (participant) {
            participant.meta.givenSum = 0;
// console.log('-----------', participant.meta.title);
            participant.fixation.whom.forEach(function(refund, i, arr) {
                if (refund.number !== null && refund.currency !== null) {
                    participant.meta.givenSum += $scope.roundOff($scope.getMoneyByAccountCurrency(refund.value, refund.currency), true);
// console.log('*** participant.meta.givenSum = ', participant.meta.givenSum);
                }
            });

            participant.meta.givenSum = $scope.roundOff(participant.meta.givenSum);
// console.log('--> participant.meta.givenSum = ', participant.meta.givenSum);
            return participant.meta.givenSum;
        };

        $scope.getRest = function (sponsor, debtor) {
            var sponsorWillReceive, debtorWillGive, preferredCurrencyRest, accountCurrencyRest;
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                accountCurrency = currentAccount.settings.accountCurrency,
                isRoundDown = (sponsor.meta.preferredCurrency == accountCurrency) ? false : true;

            sponsorWillReceive = sponsor.meta.balance - sponsor.meta.receivedSum;
            debtorWillGive = Math.abs(debtor.meta.balance + debtor.meta.givenSum);

            accountCurrencyRest = (sponsorWillReceive - debtorWillGive > 0) ? debtorWillGive : sponsorWillReceive;
            preferredCurrencyRest = $scope.getMoneyByPrefferedCurrency(accountCurrencyRest, sponsor.meta.preferredCurrency);
            preferredCurrencyRest = (preferredCurrencyRest < 1) ? 0 : $scope.roundOff(preferredCurrencyRest, isRoundDown);

            return {
                rest: (preferredCurrencyRest == 0) ? $scope.roundOff(accountCurrencyRest) : preferredCurrencyRest,
                currency: (preferredCurrencyRest == 0) ? accountCurrency : sponsor.meta.preferredCurrency
            }
        };

        $scope.getParticipantFullBalance = function (participant, participantIndex, byPrefferedCurrency) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                participantBalance = $scope.roundOff(participant.meta.balance),
                participantReceivedSum = $scope.getReceivedSum(currentAccount, participant, participantIndex),
                participantGivenSum = $scope.getGivenSum(participant),
                calculation = participantBalance - participantReceivedSum + participantGivenSum,
                result = $scope.roundOff(calculation),
                resultByPrefferedCurrency = $scope.getMoneyByPrefferedCurrency(calculation, participant.meta.preferredCurrency);

// console.log('-----------', participant.meta.title);
// console.log('participantBalance, participantReceivedSum, participantGivenSum ===> ', participantBalance, participantReceivedSum, participantGivenSum);
            participant.meta.fullBalance = result;

            return (byPrefferedCurrency) ? $scope.roundOff(resultByPrefferedCurrency, true) : result;
        };

        $scope.getReturnsBalance = function () {
            var positive = 0,
                negative = 0,
                currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            currentAccount.participants.forEach(function(participant, i, arr) {
                if (participant.meta.fullBalance > 0) {
                    positive += participant.meta.fullBalance;
                }
                if (participant.meta.fullBalance < 0) {
                    negative += participant.meta.fullBalance;
                }
            });

            return $scope.roundOff(negative) + ' / ' + $scope.roundOff(positive);
        };






        // OTHER METHODS ===============================
        $scope.roundOff = function (value, isDown) {
            if (value === undefined) return 0;

            value = Math.round(value * 100000000) / 100000000; // in order to cut off a very long fractional part

            if (isDown) {
                return Math.floor(value * 100) / 100;
            } else {
                return Math.round(value * 100) / 100;
            }
        };

        $scope.fillRefundFields = function (account, debtor, refund) {
            var sponsor = account.participants[refund.number];

            refund.value = $scope.getRest(sponsor, debtor).rest;
            refund.currency = $scope.getRest(sponsor, debtor).currency;
        };

        $scope.formatDate = function (value) {
            if (value) {
                value = new Date(value);

                return value.toLocaleString();
            } else {
                return '';
            }
        };





        $scope.$watch('expCalc', function (newValue, oldValue) {
            localStorage.setItem('expensesCalc', JSON.stringify(newValue));


            document.getElementById('testing').innerHTML = JSON.stringify(newValue)
                .replace(/\[/g, "[<div>").replace(/]/g, "</div>]")
                .replace(/{/g, "{<div>").replace(/}/g, "</div>}")
                .replace(/,/g, ",<hr>").replace(/:/g, ": ")
                .replace(/},<hr>{/g, "},{").replace(/],<hr>\[/g, "],[")
                .replace(/],\[/g, "<ar>],[</ar>").replace(/},{/g, "<arr>},{</arr>")
                .replace(/Участник/g, "<b>Участник</b>")
                .replace(/"participants": \[/g, "<b>\"participants\": [</b>")
                .replace(/"currencies": {<div>/g, "\"currencies\": {<div class='compressed'>")
                .replace(/"expensesTypes": \[<div>/g, "\"expensesTypes\": [<div class='compressed'>");

            document.getElementById('testing').querySelectorAll('div').forEach(function (item, i) {
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    e.target.classList.toggle('compressed');
                });
            });
        }, true);


        console.log($scope);

        if (false) {
            $scope.expCalc = getDataService;
        } else {
            $scope.expCalc = {"settings":{"currentAccount":0,"currencies":{"names":["usd","eur","rub","byn"],"rates":[[1,1.1934,0.0174,0.5186],[0.8379,1,0.0146,0.4345],[57.322,68.4158,1,29.7271],[1.928,2.2963,0.0336,1]]},"baseCurrency":"3","expensesTypes":[{"name":"Общие расходы","icon":""},{"name":"Продукты питания","icon":""},{"name":"Жильё","icon":""},{"name":"Машина","icon":""},{"name":"Развлечение","icon":""}]},"accounts":[{"settings":{"accountCurrency":"3","fixationDirectly":true},"meta":{"title":"Новый расчет","total":74.208,"fullRefund":-15.466800000000003},"participants":[{"meta":{"title":"Участник 0.0","participation":1,"preferredCurrency":"1","total":21,"share":10.6416,"balance":10.3584,"receivedSum":0,"givenSum":0,"fullBalance":10.36},"expenses":[{"title":"Расход 0.0.0","type":"0","date":"Tue Sep 05 2017 17:52:37 GMT+0300 (Belarus Standard Time)","value":21,"currency":"3","partList":[false,true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.1","participation":2,"preferredCurrency":"3","total":21.208,"share":31.7832,"balance":-10.575200000000002,"receivedSum":0,"givenSum":0,"fullBalance":-10.58},"expenses":[{"title":"Расход 0.1.0","type":"0","date":"Tue Sep 05 2017 17:52:42 GMT+0300 (Belarus Standard Time)","value":11,"currency":"0","partList":[true,true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.2","participation":1,"preferredCurrency":"0","total":21,"share":15.8916,"balance":5.1084,"receivedSum":0,"givenSum":0,"fullBalance":5.11},"expenses":[{"title":"Расход 0.2.0","type":"0","date":"Tue Sep 05 2017 17:52:44 GMT+0300 (Belarus Standard Time)","value":21,"currency":"3","partList":[true,true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.3","participation":1,"preferredCurrency":"3","total":11,"share":15.8916,"balance":-4.8916,"receivedSum":0,"givenSum":0,"fullBalance":-4.89},"expenses":[{"title":"Расход 0.3.0","type":"0","date":"Tue Sep 05 2017 17:52:48 GMT+0300 (Belarus Standard Time)","value":11,"currency":"3","partList":[true,true,true,true]}],"fixation":{"whom":[],"byBank":[]}}]}]}
        }
        if (!$scope.expCalc.accounts.length) $scope.createAccount();
    }];

    module.controller('calculatorCtrl', calculatorCtrl);

}(angular.module('app')));


(function (module) {

    var getDataService = function () {
        var currencies, expensesTypes, expensesCalc;

        if (localStorage.getItem('expensesCalc')) {
            expensesCalc = JSON.parse(localStorage.getItem("expensesCalc"));
        } else {
            currencies = {
                names: ['usd', 'eur', 'rub', 'byn'], // The currency number of 0, 1, 2 and 3
                rates: [ // Banks sell by these rates
                    [1,1.1934,0.0174,0.5186], // rates of the currency number 0
                    [0.8379,1,0.0146,0.4345], // rates of the currency number 1
                    [57.322,68.4158,1,29.7271], // rates of the currency number 2
                    [1.928,2.2963,0.0336,1] // rates of the currency number 3
                ]
            };
            expensesTypes = [
                {name: 'Общие расходы', icon: ''},
                {name: 'Продукты питания', icon: ''},
                {name: 'Жильё', icon: ''},
                {name: 'Машина', icon: ''},
                {name: 'Развлечение', icon: ''}
            ];
            expensesCalc = {
                settings: {
                    currentAccount: 0,
                    currencies: currencies,
                    baseCurrency: '3', // String type is necessary for select elements - we can see a selected option by default
                    expensesTypes: expensesTypes
                },
                accounts: []
            };

            localStorage.setItem('expensesCalc', JSON.stringify(expensesCalc));
        }

        return expensesCalc
    };

    module.factory('getDataService', getDataService);

}(angular.module('app')));