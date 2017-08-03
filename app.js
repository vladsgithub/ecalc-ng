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
                    balance: 0
                },
                expenses: [],
                fixation: {
                    total: 0,
                    whom: [], // it will be added objects: { to: participants[x], value: 1, reserve: null, date: null}
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






        // METHODS OF ADDING ===============================
        $scope.addNewExpense = function (obj) {
            // todo: probably rework this method - it could receive objects: account, participant

            var accountIndex = obj.$parent.$parent.$index;
            var participantIndex = obj.$index;
            var expenseIndex = obj.participant.expenses.length;
            var newExpense = {
                title: 'Расход ' + accountIndex + '.' + participantIndex + '.' + expenseIndex,
                type: '0',
                date: null,
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

        $scope.getExpenseWithRate = function (account, expense) {
            var rate = $scope.expCalc.settings.currencies.rates[account.settings.accountCurrency][expense.currency];

            return expense.value * rate;
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
                $scope.getExpenseWithRate(account, expense) /
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
                shareTotal += $scope.getParticipantShare(account, i);
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







        // OTHER METHODS ===============================
        $scope.roundOff = function (value) {
            if (value === undefined) return 0;
            return Math.round(value * 100) / 100;
        };

        $scope.fixDate = function (obj) {
            if (obj.expense.value >= 0) {
                if (!obj.expense.date) obj.expense.date = '' + new Date();
            } else {
                obj.expense.value = 0;
            }
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

        $scope.expCalc = getDataService;
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