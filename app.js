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
                    title: 'Новый расчет ' + accountIndex,
                    total: 0,
                    fullRefund: 0
                },
                participants: []
            };

            accounts.push(newAccount);
            $scope.expCalc.settings.currentAccount = accountIndex;

            $scope.createParticipant();
        };

        $scope.createParticipant = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];
            var participantIndex = currentAccount.participants.length;
            var newParticipant = {
                meta: {
                    title: 'Участник ' + $scope.expCalc.settings.currentAccount + '.' + participantIndex,
                    participation: 1,
                    preferredCurrency: currentAccount.settings.accountCurrency,
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

            currentAccount.participants.push(newParticipant);

            $scope.addParticipantToPartList();
        };






        // METHODS OF REMOVING ===============================
        $scope.removeCurrency = function (currencyIndex) {
            var error = $scope.isCurrencyUsed(currencyIndex);

            if (error) {
                alert(error);
            } else {
                alert('OK');
            }
        };

        $scope.removeCurrentAccount = function () {
            $scope.expCalc.accounts.splice($scope.expCalc.settings.currentAccount, 1);
        };

        $scope.removeParticipant = function (participantIndex) {
            var accountIndex = $scope.expCalc.settings.currentAccount;

            $scope.expCalc.accounts[accountIndex].participants.splice(participantIndex, 1);
            $scope.removeParticipantFromPartList(participantIndex);
        };

        $scope.removeExpense = function (participantIndex, expenseIndex) {
            var accountIndex = $scope.expCalc.settings.currentAccount;

            $scope.expCalc.accounts[accountIndex].participants[participantIndex].expenses.splice(expenseIndex, 1);
        };

        $scope.removeParticipantFromPartList = function (participantIndex) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            currentAccount.participants.forEach(function (participant, i, arr) {
                participant.expenses.forEach(function (expense, i, arr) {
                    expense.partList.splice(participantIndex, 1);
                });
            });
        };

        $scope.removePayment = function (debtor, refundIndex) {
            debtor.fixation.whom.splice(refundIndex, 1);
        };






        // METHODS OF ADDING ===============================
        $scope.addNewCurrency = function () {
            var newRateArr = [];

            $scope.expCalc.settings.currencies.names.push('');
            $scope.expCalc.settings.currencies.rates.forEach(function(rateArr, i, arr) {
                rateArr.push(null);
                newRateArr.push(null);
            });
            newRateArr.push(null);

            $scope.expCalc.settings.currencies.rates.push( newRateArr );
        };

        $scope.addNewExpense = function (participant, participantIndex) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];
            var accountIndex = $scope.expCalc.settings.currentAccount;
            var expenseIndex = participant.expenses.length;
            var newExpense = {
                title: 'Расход ' + accountIndex + '.' + participantIndex + '.' + expenseIndex,
                type: '0',
                date: '' + new Date(),
                value: null,
                currency: currentAccount.settings.accountCurrency,
                isPaid: false,
                partList: []
            };

            $scope.expCalc.accounts[accountIndex].participants.forEach(function (participant, i, arr) {
                newExpense.partList.push(true);
            });

            participant.expenses.push(newExpense);
        };

        $scope.addParticipantToPartList = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            currentAccount.participants.forEach(function (participant, i, arr) {
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
                value: null,
                currency: null,
                date: '' + new Date(),
                isFixed: false
            });
        };






        // METHODS OF GETTING ===============================
        $scope.getAccountCurrency = function() {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            return $scope.expCalc.settings.currencies.names[currentAccount.settings.accountCurrency];
        };

        $scope.getAccountTotal = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            currentAccount.meta.total = 0;

            currentAccount.participants.forEach(function (participant, i, arr) {
                currentAccount.meta.total += participant.meta.total;
            });

            return currentAccount.meta.total;
        };

        $scope.getParticipantTotal = function (participant) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];
            var rates = $scope.expCalc.settings.currencies.rates[currentAccount.settings.accountCurrency];

            participant.meta.total = 0;

            participant.expenses.forEach(function (expense, i, arr) {
                if (expense.isPaid) participant.meta.total += expense.value * rates[expense.currency];
            });

            return participant.meta.total;
        };

        $scope.getMoneyByAccountCurrency = function (value, exchangeCurrency) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                rate = $scope.expCalc.settings.currencies.rates[currentAccount.settings.accountCurrency][exchangeCurrency];
// console.log('getMoneyByAccountCurrency -> value * rate =', value * rate);
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

        $scope.getPartSumOfExpense = function (expense) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                partSumOfExpense = 0;

            expense.partList.forEach(function (participation, i, arr) {
                if (participation) {
                    partSumOfExpense += currentAccount.participants[i].meta.participation;
                }
            });

            return partSumOfExpense;
        };

        $scope.getExpenseShare = function (expense, extParticipantIndex) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            if (expense.isPaid) return expense.partList[extParticipantIndex] *
                currentAccount.participants[extParticipantIndex].meta.participation *
                $scope.getExpenseWithRate(expense) /
                $scope.getPartSumOfExpense(expense);
        };

        $scope.getParticipantShare = function (extParticipantIndex) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                participantShare = 0;

            currentAccount.participants.forEach(function (participant, i, arr) {
                participant.expenses.forEach(function (expense, i, arr) {
                    if (expense.isPaid) participantShare += $scope.getExpenseShare(expense, extParticipantIndex);
                });
            });

            currentAccount.participants[extParticipantIndex].meta.share = participantShare;

            return participantShare;
        };

        $scope.getShareTotal = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                shareTotal = 0;

            currentAccount.participants.forEach(function (participant, i, arr) {
                shareTotal += currentAccount.participants[i].meta.share;
            });

            return shareTotal;
        };

        $scope.getFullRefund = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];
            var balance, fullRefund = 0;

            currentAccount.participants.forEach(function (participant, i, arr) {
                balance = participant.meta.total - participant.meta.share;
                fullRefund += (balance < 0) ? balance : 0;
            });

            currentAccount.meta.fullRefund = fullRefund;

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

        $scope.getReceivedSum = function (participant, participantIndex) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            participant.meta.receivedSum = 0;
// console.log('-----------', participant.meta.title);
            currentAccount.participants.forEach(function(person, i, arr) {
                person.fixation.whom.forEach(function(refund, n, arr) {
                    if (refund.isFixed && participantIndex == refund.number && refund.number !== null && refund.currency !== null) {
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
                if (refund.isFixed && refund.number !== null && refund.currency !== null) {
// console.log('*** refund.value, refund.currency = ', refund.value, refund.currency);
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
                isRoundDown = (sponsor.meta.preferredCurrency != accountCurrency);

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
                participantReceivedSum = $scope.getReceivedSum(participant, participantIndex),
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

            currentAccount.meta.negativeFullBalance = $scope.roundOff(negative);
            currentAccount.meta.positiveFullBalance = $scope.roundOff(positive);

            return currentAccount.meta.negativeFullBalance + ' / ' + currentAccount.meta.positiveFullBalance;
        };






        // OTHER METHODS ===============================
        $scope.roundOff = function (value, isDown) {
            if (value === undefined) return 0;
            if (value > 9999999999) {
                console.error('The value is very long:', value);
                return 0;
            }

// console.log('value = ', value);
            value = Math.round(value * 1000000000 * 100) / 1000000000; // in order to cut off a very long fractional part
// console.log('value after cut off = ', value);
            if (isDown) {
                return Math.floor(value) / 100;
            } else {
                return Math.round(value) / 100;
            }
        };

        $scope.fillRefundFields = function (debtor, refund) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                sponsor = currentAccount.participants[refund.number],
                value = $scope.getRest(sponsor, debtor).rest;

            refund.value = (debtor.meta.fullBalance < 0 && value > 0) ? value : null;
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

        $scope.isAllRefundsFixed = function (participant) {
            var result = true;

            participant.fixation.whom.forEach(function(refund, i, arr) {
                result = result && refund.isFixed;
            });

            return result;
        };

        $scope.checkRefundFields = function (refund) {
            if (refund.number == null || refund.value == null || refund.currency == null) refund.isFixed = false;
        };

        $scope.checkPartList = function (partList, extParticipantIndex) {
            var isValid = false;

            partList.forEach(function(checked, i, arr) {
                isValid = isValid || checked;
            });

            if (!isValid) {
                partList[extParticipantIndex] = true;
                alert('Нельзя отменить участие в одном и том же расходе для всех участников');
            }
        };

        $scope.isCurrencyUsed = function (currencyIndex) {
            var message, errors, errorAccountTitle, errorParticipantTitle, preferredCurrencyError, whomCurrencyError, expensesError;
            var result = '',
                tempArr = [],
                removeCurrency = $scope.expCalc.settings.currencies.names[currencyIndex].toUpperCase();

                $scope.expCalc.accounts.forEach(function(account, i, arr) {
                if (currencyIndex == account.settings.accountCurrency) tempArr.push(account.meta.title);
            });

            if (tempArr.length) {
                result = 'Валюта ' + removeCurrency + ' используется в качестве основной в следующих расчетах:\n';
                result += tempArr.join('; ');
                result += '\n';
            }

            // Валюта ААА не может быть удалена по следующим причинам:

            // [Расчет 1; Участник 0.0]
            // - Предпочитает валюту ААА
            // - Вернул долг в валюте ААА
            // - Валюта ААА используется в расходах:
            // Расход 0.0.0; Расход 0.0.2;


            // var expensesArr = [];

            $scope.expCalc.accounts.forEach(function(account, accountIndex, accountArr) {
                errors = [];
                errorAccountTitle = '[ ' + account.meta.title + '; ';

                account.participants.forEach(function(participant, participantIndex, participantArr) {
                    errorParticipantTitle = participant.meta.title + ' ]\n';
                    tempArr = [];
                    preferredCurrencyError = '';
                    whomCurrencyError = '';
                    expensesError = '- Валюта ' + removeCurrency + ' используется в расходах:\n';

                    if (participant.meta.preferredCurrency == currencyIndex) {
                        preferredCurrencyError = '- Предпочитает валюту ' + removeCurrency + '\n';
                    }
                    participant.fixation.whom.forEach(function(whom, whomIndex, whomArr) {
                        if (whom.currency == currencyIndex) {
                            whomCurrencyError = '- Вернул долг в валюте ' + removeCurrency + '\n';
                        }
                    });
                    participant.expenses.forEach(function(expense, expenseIndex, expenseArr) {
                        if (expense.currency == currencyIndex) {
                            tempArr.push(expense.title);
                        }
                    });

                    if (preferredCurrencyError || whomCurrencyError || tempArr.length) {
                        message = errorAccountTitle + errorParticipantTitle + preferredCurrencyError + whomCurrencyError;

                        if (tempArr.length) message += expensesError + tempArr.join('; ');

                        errors.push(message);
                    }
                });
            });

            if (result || errors.length) {
                result = 'Валюта ' + removeCurrency + ' не может быть удалена по следующим причинам:\n' + result + errors.join('\n');
            }

            return result;
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

        $scope.copyObjectToBuffer = function () {
            var objectDiv = document.getElementById('angularObject');
            var range = document.createRange();
            range.selectNode(objectDiv);
            var selection = window.getSelection();
            selection.addRange(range);

            try {
                // Теперь, когда мы выбрали текст ссылки, выполним команду копирования
                var successful = document.execCommand('copy');
                var msg = successful ? 'УСПЕШНО' : 'ПЛОХО!!!';
                var selectedObject = selection.toString();

                msg = (selectedObject.length) ? msg : 'неудачно. Повторите попытку копирования';
                alert('Объект скопировался ' + msg + ': ' + selectedObject);
            } catch(err) {
                alert('Проблема с копированием');
            }

            // Снятие выделения - ВНИМАНИЕ: вы должны использовать
            // removeRange(range) когда это возможно
            window.getSelection().removeAllRanges();
            // window.getSelection().removeRange(range);
            selection.removeAllRanges();
        };


        console.log($scope);

        if (false) {
            $scope.expCalc = getDataService;
        } else {
            $scope.expCalc =
                {"settings":{"currentAccount":0,"currencies":{"names":["usd","eur","rub","byn","new"],"rates":[[1,1.1934,0.0174,0.5186,2],[0.8379,1,0.0146,0.4345,2],[57.322,68.4158,1,29.7271,2],[1.928,2.2963,0.0336,1,2],[1,1,1,1,1]]},"baseCurrency":"3","expensesTypes":[{"name":"Общие расходы","icon":""},{"name":"Продукты питания","icon":""},{"name":"Жильё","icon":""},{"name":"Машина","icon":""},{"name":"Развлечение","icon":""}]},"accounts":[{"settings":{"accountCurrency":"3","fixationDirectly":true},"meta":{"title":"Новый расчет 0","total":21,"fullRefund":-11,"negativeFullBalance":-5,"positiveFullBalance":5},"participants":[{"meta":{"title":"Участник 0.0","participation":1,"preferredCurrency":"4","total":18,"share":7,"balance":11,"receivedSum":6,"givenSum":0,"fullBalance":5},"expenses":[{"title":"Расход 0.0.0","type":"0","date":"Mon Sep 25 2017 16:06:43 GMT+0300 (Belarus Standard Time)","value":5,"currency":"4","isPaid":true,"partList":[true,true,true]},{"title":"Расход 0.0.1","type":"0","date":"Mon Sep 25 2017 16:06:48 GMT+0300 (Belarus Standard Time)","value":4,"currency":"4","isPaid":true,"partList":[true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.1","participation":1,"preferredCurrency":"3","total":3,"share":7,"balance":-4,"receivedSum":0,"givenSum":0,"fullBalance":-4},"expenses":[{"title":"Расход 0.1.0","type":"0","date":"Mon Sep 25 2017 16:06:54 GMT+0300 (Belarus Standard Time)","value":3,"currency":"3","isPaid":true,"partList":[true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 0.2","participation":1,"preferredCurrency":"3","total":0,"share":7,"balance":-7,"receivedSum":0,"givenSum":6,"fullBalance":-1},"expenses":[],"fixation":{"whom":[{"number":"0","value":"3","currency":"4","date":"Thu Sep 28 2017 20:11:46 GMT+0300 (Belarus Standard Time)","isFixed":true}],"byBank":[]}}]},{"settings":{"accountCurrency":"0","fixationDirectly":true},"meta":{"title":"Новый расчет 1","total":60.4464,"fullRefund":-27.851200000000006,"negativeFullBalance":-27.86,"positiveFullBalance":27.85},"participants":[{"meta":{"title":"Участник 1.0","participation":1,"preferredCurrency":"3","total":6.223199999999999,"share":20.1488,"balance":-13.925600000000003,"receivedSum":0,"givenSum":0,"fullBalance":-13.93},"expenses":[{"title":"Расход 1.0.0","type":"0","date":"Mon Sep 25 2017 16:07:46 GMT+0300 (Belarus Standard Time)","value":12,"currency":"3","isPaid":true,"partList":[true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 1.1","participation":1,"preferredCurrency":"3","total":48,"share":20.1488,"balance":27.8512,"receivedSum":0,"givenSum":0,"fullBalance":27.85},"expenses":[{"title":"Расход 1.1.0","type":"0","date":"Mon Sep 25 2017 16:07:48 GMT+0300 (Belarus Standard Time)","value":12,"currency":"4","isPaid":true,"partList":[true,true,true]},{"title":"Расход 1.1.1","type":"0","date":"Mon Sep 25 2017 16:07:49 GMT+0300 (Belarus Standard Time)","value":12,"currency":"4","isPaid":true,"partList":[true,true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 1.2","participation":1,"preferredCurrency":"3","total":6.223199999999999,"share":20.1488,"balance":-13.925600000000003,"receivedSum":0,"givenSum":0,"fullBalance":-13.93},"expenses":[{"title":"Расход 1.2.0","type":"0","date":"Mon Sep 25 2017 16:07:51 GMT+0300 (Belarus Standard Time)","value":12,"currency":"3","isPaid":true,"partList":[true,true,true]}],"fixation":{"whom":[],"byBank":[]}}]},{"settings":{"accountCurrency":"1","fixationDirectly":true},"meta":{"title":"Новый расчет 2","total":342.7194,"fullRefund":-23.56389999999999,"negativeFullBalance":-23.56,"positiveFullBalance":23.56},"participants":[{"meta":{"title":"Участник 2.0","participation":1,"preferredCurrency":"3","total":147.7958,"share":171.3597,"balance":-23.56389999999999,"receivedSum":0,"givenSum":0,"fullBalance":-23.56},"expenses":[{"title":"Расход 2.0.0","type":"0","date":"Wed Sep 27 2017 14:10:55 GMT+0300 (Belarus Standard Time)","value":123,"currency":"2","isPaid":true,"partList":[true,true]},{"title":"Расход 2.0.1","type":"0","date":"Wed Sep 27 2017 14:11:01 GMT+0300 (Belarus Standard Time)","value":10000,"currency":"2","isPaid":true,"partList":[true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 2.1","participation":1,"preferredCurrency":"3","total":194.9236,"share":171.3597,"balance":23.56389999999999,"receivedSum":0,"givenSum":0,"fullBalance":23.56},"expenses":[{"title":"Расход 2.1.0","type":"0","date":"Wed Sep 27 2017 14:11:07 GMT+0300 (Belarus Standard Time)","value":12666,"currency":"2","isPaid":true,"partList":[true,true]},{"title":"Расход 2.1.1","type":"0","date":"Wed Sep 27 2017 14:11:15 GMT+0300 (Belarus Standard Time)","value":10,"currency":"1","isPaid":true,"partList":[true,true]}],"fixation":{"whom":[],"byBank":[]}}]},{"settings":{"accountCurrency":"3","fixationDirectly":true},"meta":{"title":"Новый расчет 3","total":90.064,"fullRefund":-6.0319999999999965,"negativeFullBalance":-6.03,"positiveFullBalance":6.03},"participants":[{"meta":{"title":"Участник 3.0","participation":1,"preferredCurrency":"3","total":39,"share":45.032,"balance":-6.0319999999999965,"receivedSum":0,"givenSum":0,"fullBalance":-6.03},"expenses":[{"title":"Расход 3.0.0","type":"0","date":"Mon Sep 25 2017 16:08:06 GMT+0300 (Belarus Standard Time)","value":13,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Расход 3.0.1","type":"0","date":"Mon Sep 25 2017 16:08:07 GMT+0300 (Belarus Standard Time)","value":13,"currency":"3","isPaid":true,"partList":[true,true]}],"fixation":{"whom":[],"byBank":[]}},{"meta":{"title":"Участник 3.1","participation":1,"preferredCurrency":"3","total":51.064,"share":45.032,"balance":6.032000000000004,"receivedSum":0,"givenSum":0,"fullBalance":6.03},"expenses":[{"title":"Расход 3.1.0","type":"0","date":"Mon Sep 25 2017 16:08:10 GMT+0300 (Belarus Standard Time)","value":13,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Расход 3.1.1","type":"0","date":"Mon Sep 25 2017 16:08:11 GMT+0300 (Belarus Standard Time)","value":13,"currency":"0","isPaid":true,"partList":[true,true]}],"fixation":{"whom":[],"byBank":[]}}]}]}
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