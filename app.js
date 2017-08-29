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
                participants: [],
                sponsors: []
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

            account.participants.forEach(function(person, i, arr) {
                person.fixation.whom.forEach(function(refund, n, arr) {
                    if (participantIndex == refund.number && refund.number !== null && refund.currency !== null) {
                        participant.meta.receivedSum += $scope.getMoneyByAccountCurrency(refund.value, refund.currency);
                    }
                });
            });

            participant.meta.receivedSum = $scope.roundOff(participant.meta.receivedSum);

            return participant.meta.receivedSum;
        };

        $scope.getGivenSum = function (participant) {
            participant.meta.givenSum = 0;

            participant.fixation.whom.forEach(function(refund, i, arr) {
                if (refund.number !== null && refund.currency !== null) {
                    participant.meta.givenSum += $scope.getMoneyByAccountCurrency(refund.value, refund.currency);
                }
            });

            participant.meta.givenSum = $scope.roundOff(participant.meta.givenSum);

            return participant.meta.givenSum;
        };

        $scope.getRest = function (sponsor, debtor) {
            var sponsorWillReceive, debtorWillGive, preferredCurrencyRest, accountCurrencyRest;
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                accountCurrency = currentAccount.settings.accountCurrency;

            sponsorWillReceive = sponsor.meta.balance - sponsor.meta.receivedSum;
            debtorWillGive = Math.abs(debtor.meta.balance + debtor.meta.givenSum);

            accountCurrencyRest = (sponsorWillReceive - debtorWillGive > 0) ? debtorWillGive : sponsorWillReceive;
            preferredCurrencyRest = $scope.getMoneyByPrefferedCurrency(accountCurrencyRest, sponsor.meta.preferredCurrency);
            preferredCurrencyRest = (preferredCurrencyRest < 0) ? 0 : $scope.roundOff(preferredCurrencyRest, true);

            return {
                rest: (preferredCurrencyRest == 0) ? $scope.roundOff(accountCurrencyRest) : preferredCurrencyRest,
                currency: (preferredCurrencyRest == 0) ? accountCurrency : sponsor.meta.preferredCurrency
            }
        };

        $scope.getParticipantBalance = function () {

        };






        // OTHER METHODS ===============================
        $scope.roundOff = function (value, isDown) {
            if (value === undefined) return 0;

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
            $scope.expCalc = {"settings":{"currentAccount":0,"currencies":{"names":["usd","eur","rub","byn"],"rates":[[1,0.8971,59.8981,1.927],[null,1,null,null],[null,null,1,null],[1.933,2.158,0.0324,1]]},"baseCurrency":"3","expensesTypes":[{"name":"Общие расходы","icon":""},{"name":"Продукты питания","icon":""},{"name":"Жильё","icon":""},{"name":"Машина","icon":""},{"name":"Развлечение","icon":""}]},"accounts":[{"settings":{"accountCurrency":"3","fixationDirectly":true},"meta":{"title":"Новый расчет","total":6,"fullRefund":-1.9000000000000001},"participants":[{"meta":{"title":"Участник 0.0","participation":1,"preferredCurrency":"3","total":2,"share":0.8,"balance":1.2,"receivedSum":0,"givenSum":0},"expenses":[{"title":"Расход 0.0.0","type":"0","date":"Wed Aug 16 2017 12:21:20 GMT+0300 (Belarus Standard Time)","value":2,"currency":"3","partList":[false,true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.1","participation":2,"preferredCurrency":"3","total":1,"share":2.6,"balance":-1.6,"receivedSum":0,"givenSum":0},"expenses":[{"title":"Расход 0.1.0","type":"0","date":"Wed Aug 16 2017 12:21:27 GMT+0300 (Belarus Standard Time)","value":1,"currency":"3","partList":[true,true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.2","participation":1,"preferredCurrency":"3","total":2,"share":1.3,"balance":0.7,"receivedSum":0,"givenSum":0},"expenses":[{"title":"Расход 0.2.0","type":"0","date":"Wed Aug 16 2017 12:21:29 GMT+0300 (Belarus Standard Time)","value":2,"currency":"3","partList":[true,true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.3","participation":1,"preferredCurrency":"3","total":1,"share":1.3,"balance":-0.30000000000000004,"receivedSum":0,"givenSum":0},"expenses":[{"title":"Расход 0.3.0","type":"0","date":"Wed Aug 16 2017 12:21:30 GMT+0300 (Belarus Standard Time)","value":1,"currency":"3","partList":[true,true,true,true]}],"fixation":{"whom":[],"byBank":[]}}],"sponsors":[]}]}
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
                    [1, 0.8971, 59.8981, 1.9270], // rates of the currency number 0
                    [null, 1, null, null], // rates of the currency number 1
                    [null, null, 1, null], // rates of the currency number 2
                    [1.9330, 2.1580, 0.0324, 1] // rates of the currency number 3
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