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
                    fullRefund: 0,
                    negBalance: 0,
                    posBalance: 0,
                    negBalanceByBank: 0,
                    posBalanceByBank: 0,
                    bank: 0
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
                    givenSum: 0,
                    fullBalance: 0,
                    fullBalanceByBank: 0
                },
                expenses: [],
                fixation: {
                    whom: [],
                    byBank: [], // it will be added objects: { value: null, reserve: null, date: null} (participants can return money by some parts)
                    reserve: 0
                }
            };

            currentAccount.participants.push(newParticipant);

            $scope.addParticipantToPartList();
        };






        // METHODS OF REMOVING ===============================
        $scope.removeExpensesType = function (typeIndex) {
            var error = $scope.isExpensesTypeUsed(typeIndex);

            if (error) {
                alert(error);
            } else {
                $scope.expCalc.accounts.forEach(function(account, accountIndex, accountArr) {
                    account.participants.forEach(function(participant, participantIndex, participantArr) {
                        participant.expenses.forEach(function(expense, expenseIndex, expenseArr) {
                            if (expense.type > typeIndex) {
                                expense.type = (expense.type - 1).toString();
                            }
                        });
                    });
                });

                $scope.expCalc.settings.expensesTypes.splice(typeIndex, 1);
            }
        };

        $scope.removeCurrency = function (currencyIndex) {
            var error = $scope.isCurrencyUsed(currencyIndex);

            if (error) {
                alert(error);
            } else {
                if ($scope.expCalc.settings.baseCurrency > currencyIndex) {
                    $scope.expCalc.settings.baseCurrency = ($scope.expCalc.settings.baseCurrency - 1).toString();
                }

                $scope.expCalc.accounts.forEach(function(account, accountIndex, accountArr) {

                    if (account.settings.accountCurrency > currencyIndex) {
                        account.settings.accountCurrency = (account.settings.accountCurrency - 1).toString();
                    }

                    account.participants.forEach(function(participant, participantIndex, participantArr) {

                        if (participant.meta.preferredCurrency > currencyIndex) {
                            participant.meta.preferredCurrency = (participant.meta.preferredCurrency - 1).toString();
                        }

                        participant.expenses.forEach(function(expense, expenseIndex, expenseArr) {
                            if (expense.currency > currencyIndex) {
                                expense.currency = (expense.currency - 1).toString();
                            }
                        });
                        participant.fixation.whom.forEach(function(whom, whomIndex, whomArr) {
                            if (whom.currency > currencyIndex) {
                                whom.currency = (whom.currency - 1).toString();
                            }
                        });

                    });
                });

                $scope.expCalc.settings.currencies.names.splice(currencyIndex, 1);
                $scope.expCalc.settings.currencies.rates.splice(currencyIndex, 1);
                $scope.expCalc.settings.currencies.rates.forEach(function(rateArr, i, arr) {
                    rateArr.splice(currencyIndex, 1);
                });
            }
        };

        $scope.removeCurrentAccount = function () {
            $scope.expCalc.accounts.splice($scope.expCalc.settings.currentAccount, 1);
        };

        $scope.removeParticipant = function (participantIndex) {
            var accountIndex = $scope.expCalc.settings.currentAccount,
                error = $scope.werePaymentsFromParticipant(participantIndex);

            if (error) {
                alert(error);
            } else {
                $scope.expCalc.accounts[accountIndex].participants.splice(participantIndex, 1);
                $scope.removeParticipantFromPartList(participantIndex);
            }
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

        $scope.removePaymentByBank = function (participant, byBankObjectIndex) {
            participant.fixation.byBank.splice(byBankObjectIndex, 1);
        };






        // METHODS OF ADDING ===============================
        $scope.addNewExpensesType = function () {
            $scope.expCalc.settings.expensesTypes.push({
                name: '',
                icon: ''
            });
        };

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

        $scope.addNewPaymentByBank = function(participant, direction) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                value = (currentAccount.meta.bank < participant.meta.fullBalanceByBank) ? currentAccount.meta.bank : participant.meta.fullBalanceByBank,
                byBankValue = (direction > 0) ? value : (participant.meta.fullBalanceByBank < 0) ? -participant.meta.fullBalanceByBank : null;

            if (byBankValue < 0) byBankValue = null;

            if (direction == 1 && currentAccount.meta.bank == 0) {
                alert('Банк пуст и вы ничего не сможете получить');

                return false;
            }

            participant.fixation.byBank.push({
                token: direction,
                value: byBankValue,
                date: '' + new Date(),
                isFixed: false
            });
        };

        $scope.addSurcharge = function() {
            var commonSurcharge = $scope.expCalc.settings.currencies.commonSurcharge;

            $scope.expCalc.settings.currencies.rates.forEach(function(ratesRow, i) {
                ratesRow.forEach(function(rate, j) {
                    if (i != j) {
                        $scope.expCalc.settings.currencies.rates[i][j] = rate + Math.round(100000 * rate * (commonSurcharge / 100)) / 100000;
                    }
                });
            });
        };








        // METHODS OF GETTING ===============================
        $scope.getAccountCurrency = function() {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            return $scope.expCalc.settings.currencies.names[currentAccount.settings.accountCurrency].toUpperCase();
        };

        $scope.getAccountTotal = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            currentAccount.meta.total = 0;

            currentAccount.participants.forEach(function (participant, i, arr) {
                currentAccount.meta.total += participant.meta.total;
            });

            currentAccount.meta.total = $scope.exact(currentAccount.meta.total);

            return $scope.exact(currentAccount.meta.total);
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
            var share;
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                participantShare = 0,
                expensesByTypes = [];

            $scope.expCalc.settings.expensesTypes.forEach(function (type, i, arr) {
                expensesByTypes.push(0);
            });

            currentAccount.participants.forEach(function (participant, i, arr) {
                participant.expenses.forEach(function (expense, i, arr) {
                    if (expense.isPaid) {
                        share = $scope.getExpenseShare(expense, extParticipantIndex);
                        participantShare += share;
                        expensesByTypes[expense.type] += share;
                    }
                });
            });

            expensesByTypes.forEach(function (expenseByType, i, arr) {
                arr[i] = $scope.roundOff(expenseByType);
            });

            currentAccount.participants[extParticipantIndex].meta.expensesByTypes = expensesByTypes;
            currentAccount.participants[extParticipantIndex].meta.share = $scope.exact(participantShare);

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

            currentAccount.meta.fullRefund = $scope.exact(fullRefund);

            return fullRefund;
        };

        $scope.getBalance = function (participant) {
            participant.meta.balance = $scope.exact(participant.meta.total - participant.meta.share);

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

            currentAccount.participants.forEach(function(person, i, arr) {
                person.fixation.whom.forEach(function(refund, n, arr) {
                    if (refund.isFixed && participantIndex == refund.number && refund.number !== null && refund.currency !== null) {
                        participant.meta.receivedSum += $scope.roundOff($scope.getMoneyByAccountCurrency(refund.value, refund.currency), true);
                    }
                });
            });

            participant.meta.receivedSum = $scope.roundOff(participant.meta.receivedSum);

            return participant.meta.receivedSum;
        };

        $scope.getGivenSum = function (participant) {
            participant.meta.givenSum = 0;

            participant.fixation.whom.forEach(function(refund, i, arr) {
                if (refund.isFixed && refund.number !== null && refund.currency !== null) {
                    participant.meta.givenSum += $scope.roundOff($scope.getMoneyByAccountCurrency(refund.value, refund.currency), true);
                }
            });

            participant.meta.givenSum = $scope.roundOff(participant.meta.givenSum);

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

            participant.meta.fullBalance = result;

            return (byPrefferedCurrency) ? $scope.roundOff(resultByPrefferedCurrency, true) : result;
        };

        $scope.getReturnsBalance = function (method) {
            var balance,
                positive = 0,
                negative = 0,
                currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            currentAccount.participants.forEach(function(participant, i, arr) {
                balance = (method == 'byBank') ? participant.meta.fullBalanceByBank : participant.meta.fullBalance

                if (balance > 0) {
                    positive += balance;
                } else {
                    negative += balance;
                }
            });

            if (method == 'byBank') {
                currentAccount.meta.negBalanceByBank = $scope.roundOff(negative);
                currentAccount.meta.posBalanceByBank = $scope.roundOff(positive);

                return currentAccount.meta.negBalanceByBank + ' / ' + currentAccount.meta.posBalanceByBank;
            } else {
                currentAccount.meta.negBalance = $scope.roundOff(negative);
                currentAccount.meta.posBalance = $scope.roundOff(positive);

                return currentAccount.meta.negBalance + ' / ' + currentAccount.meta.posBalance;
            }
        };

        $scope.getAccountBank = function () {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                result = 0;

            currentAccount.participants.forEach(function(participant, participantIndex, arr) {
                participant.fixation.byBank.forEach(function(byBankObject, i, arr2) {
                    if (byBankObject.isFixed) result += (-1) * byBankObject.token * byBankObject.value;
                });
            });

            currentAccount.meta.bank = $scope.roundOff(result);

            return currentAccount.meta.bank;
        };

        $scope.getParticipantFullBalanceByBank = function (participant) {
            var result = 0;

            participant.fixation.byBank.forEach(function(byBankObject, i, arr) {
                if (byBankObject.isFixed) result += byBankObject.token * byBankObject.value;
            });

            participant.meta.fullBalanceByBank = $scope.roundOff(participant.meta.balance - result);

            return participant.meta.fullBalanceByBank;
        };










        // OTHER METHODS ===============================
        $scope.exact = function (value) {
            return Math.round(value * 1000000000) / 1000000000; // in order to cut off a very long fractional part
        };

        $scope.roundOff = function (value, isDown) {
            if (value === undefined) return 0;
            if (value > 9999999999) {
                console.error('The value is very long:', value);
                return 0;
            }

            value = $scope.exact(value);

            if (isDown) {
                return Math.floor(value * 100) / 100;
            } else {
                return Math.round(value * 100) / 100;
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

        $scope.isExpensesTypeUsed = function (typeIndex) {
            var message, errorAccountTitle, errorParticipantTitle, expensesTypeError;
            var result = '',
                errors = [],
                tempArr = [],
                removableType = $scope.expCalc.settings.expensesTypes[typeIndex].name;

            $scope.expCalc.accounts.forEach(function(account, accountIndex, accountArr) {
                errorAccountTitle = '\n[ ' + account.meta.title + '; ';

                account.participants.forEach(function(participant, participantIndex, participantArr) {
                    errorParticipantTitle = participant.meta.title + ' ]\n';
                    tempArr = [];
                    expensesTypeError = '- Тип "' + removableType + '" используется в расходах:\n';


                    participant.expenses.forEach(function(expense, expenseIndex, expenseArr) {
                        if (expense.type == typeIndex) tempArr.push(expense.title);
                    });

                    if (tempArr.length) {
                        message = errorAccountTitle + errorParticipantTitle + expensesTypeError + tempArr.join('; ');

                        errors.push(message);
                    }
                });

            });

            if (errors.length) {
                result = 'Тип "' + removableType + '" не может быть удален по следующим причинам:\n' + errors.join('\n');
            }

            return result;
        };

        $scope.isCurrencyUsed = function (currencyIndex) {
            var message, errorAccountTitle, errorParticipantTitle, preferredCurrencyError, whomCurrencyError, expensesError;
            var result = '',
                errors = [],
                tempArr = [],
                removeCurrency = $scope.expCalc.settings.currencies.names[currencyIndex].toUpperCase();

                $scope.expCalc.accounts.forEach(function(account, i, arr) {
                if (currencyIndex == account.settings.accountCurrency) tempArr.push(account.meta.title);
            });

            if (tempArr.length) {
                result = 'Валюта ' + removeCurrency + ' используется как основная в расчетах:\n';
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
                errorAccountTitle = '\n[ ' + account.meta.title + '; ';

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
                            whomCurrencyError = '- Вернул долг напрямую в валюте ' + removeCurrency + '\n';
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

        $scope.werePaymentsFromParticipant = function(verifiableParticipantIndex) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount],
                verifiableParticipant = currentAccount.participants[verifiableParticipantIndex];
            var result = false,
                givenPaymentError = '',
                receivedPaymentError = '',
                calculationByBank = '';

            currentAccount.participants.forEach(function(participant, participantIndex, participantArr) {
                if (participantIndex == verifiableParticipantIndex && participant.fixation.whom.length) {
                    givenPaymentError = '- ' + participant.meta.title + ' сделал взносы (расчет напрямую);\n';
                }
                
                participant.fixation.whom.forEach(function(whom, whomIndex, whomArr) {
                    if (whom.number == verifiableParticipantIndex) {
                        receivedPaymentError += '- ' + verifiableParticipant.meta.title + ' получил взнос от ' + participant.meta.title + ';\n';
                    }
                });
            });

            currentAccount.participants.forEach(function(participant, participantIndex, participantArr) {
                if (participantIndex == verifiableParticipantIndex && participant.fixation.byBank.length) {
                    calculationByBank = '- ' + participant.meta.title + ' участвует в расчетах через общий банк;\n';
                }
            });

            if (givenPaymentError || receivedPaymentError) {
                result = 'Невозможно удалить участника по следующим причинам:\n' + givenPaymentError + receivedPaymentError + calculationByBank;
            }

            return result;
        };

        $scope.checkPaymentByBank = function (byBankObject) {
            var currentAccount = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            if (!byBankObject.isFixed) return;

            if (byBankObject.value <= 0) {
                byBankObject.isFixed = false;

                alert('Значение должно быть положительным');
            }

            if (byBankObject.token > 0 && byBankObject.value > currentAccount.meta.bank) {
                byBankObject.isFixed = false;

                alert('В банке ' + currentAccount.meta.bank + ' ' + $scope.getAccountCurrency() + ', сейчас вы можете получить только этот максимум');

                byBankObject.value = currentAccount.meta.bank;
            }
        };

        $scope.today = function () {
            return $scope.formatDate('' + new Date());
        };

        $scope.updateCurrencies = function () {
            var rows, currentCurrencies;
            var table = document.getElementById('currenciesTable').querySelectorAll('table')[0];

            if (!table) {
                alert('Не удалось получить данные');
                return;
            }

            rows = table.querySelectorAll('tr');
            currentCurrencies = $scope.expCalc.settings.currencies;
            currenciesNames = [];
            currenciesByUSD = [];

            currentCurrencies.names.forEach(function(currencyName, i, arr) {
                currenciesNames.push(currencyName.split(' ')[0].toUpperCase());
            });

            rows.forEach(function(row, i) {
                var tds = row.querySelectorAll('td');

                currenciesNames.forEach(function(currency, j) {
                    if (tds[0].innerHTML.indexOf(currency) != -1) {
                        currenciesByUSD.push({
                            name: currency,
                            value: tds[1].innerHTML.replace(',', '.')
                        });
                    }
                });

            });

            currenciesNames.forEach(function(currencyName, i) {
                var baseValue;

                currenciesByUSD.forEach(function(currencyObj, n) {
                    if (currencyObj.name == currencyName) baseValue = currencyObj.value;
                });

                if (baseValue) currenciesNames.forEach(function(comparableCurrency, j) {
                    var byValue, digitsNumber, capacity = 1;

                    currenciesByUSD.forEach(function(currencyObj, n) {
                        if (currencyObj.name == comparableCurrency) byValue = currencyObj.value;
                    });

                    if (byValue) {
                        digitsNumber = (byValue.toString().length > baseValue.toString().length) ? byValue.toString().length : baseValue.toString().length;
                        for (var m = 0; m < digitsNumber; m++) capacity *= 10;

                        // console.log(digitsNumber, capacity, currencyName, comparableCurrency, '=', Math.round(capacity * byValue / baseValue) / capacity, byValue / baseValue);
                        currentCurrencies.rates[j][i] = Math.round(capacity * byValue / baseValue) / capacity;
                    }
                });
            });

            $scope.addSurcharge();
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
                {"settings":{"currentAccount":0,"currencies":{"commonSurcharge": 0, "names":["usd доллар","eur евро","rub рос.рубль","byn","pln злотый","huf форинт","hrk куна","czk крона"],"rates":[[1,1.1644,0.01687,0.502,0.27496,0.003736,0.15436,0.04561],[0.85892,1,0.01449,0.43113,0.23614,0.003209,0.13266,0.03917],[59.2774,69.0198,1,29.7563,16.2981,0.22145,9.1559,2.7033],[1.995,2.323,0.0337,1,0.554,0.007437,0.309,0.091],[3.6369,4.2348,0.06135,1.8257,1,0.01359,0.56137,0.16586],[267.54,311.67,4.5166,134.37,73.5975,1,41.3455,12.2071],[6.4709,7.5382,0.10924,3.2499,1.7801,0.02419,1,0.29525],[21.9188,25.5318,0.37004,11.0076,6.0291,0.08192,3.3864,1]]},"baseCurrency":"3","expensesTypes":[{"name":"Общие расходы","icon":""},{"name":"Питание","icon":""},{"name":"Жильё","icon":""},{"name":"Машина","icon":""},{"name":"Развлечение","icon":""},{"name":"Товары домой","icon":""},{"name":"Другое","icon":""}],"isPrintView":false},"accounts":[{"settings":{"accountCurrency":"3","fixationDirectly":true},"meta":{"title":"Хорватия","total":5199.176315,"fullRefund":-1423.914111667,"negBalance":-1423.91,"posBalance":1423.91,"negBalanceByBank":0,"posBalanceByBank":0,"bank":0},"participants":[{"meta":{"title":"Стасики","participation":2,"preferredCurrency":"3","total":4890.031655000001,"share":3466.117543333,"balance":1423.914111667,"receivedSum":0,"givenSum":0,"fullBalance":1423.91,"fullBalanceByBank":0,"expensesByTypes":[427.03,386.39,1423.02,786.37,132.02,298.93,12.36]},"expenses":[{"title":"Страховка на машину","type":"3","date":"Fri Nov 10 2017 11:51:42 GMT+0300 (Belarus Standard Time)","value":56,"currency":"0","isPaid":true,"partList":[true,true]},{"title":"Жильё в Подстране","type":"2","date":"Fri Nov 10 2017 11:53:09 GMT+0300 (Belarus Standard Time)","value":840,"currency":"0","isPaid":true,"partList":[true,true]},{"title":"Жильё в Люблине","type":"2","date":"Fri Nov 10 2017 11:53:50 GMT+0300 (Belarus Standard Time)","value":127.8,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Жильё в Будапеште","type":"2","date":"Fri Nov 10 2017 12:07:18 GMT+0300 (Belarus Standard Time)","value":53,"currency":"0","isPaid":true,"partList":[true,true]},{"title":"Бензин","type":"3","date":"Fri Nov 10 2017 12:07:44 GMT+0300 (Belarus Standard Time)","value":37.5,"currency":"3","isPaid":true,"partList":[true,true]},{"title":"Дьютик","type":"5","date":"Fri Nov 10 2017 12:10:04 GMT+0300 (Belarus Standard Time)","value":46.83,"currency":"3","isPaid":true,"partList":[true,true]},{"title":"Еда Ржешув","type":"1","date":"Fri Nov 10 2017 12:11:51 GMT+0300 (Belarus Standard Time)","value":44,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Магазин Ржешув","type":"1","date":"Fri Nov 10 2017 12:12:25 GMT+0300 (Belarus Standard Time)","value":13.03,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Бензин","type":"3","date":"Fri Nov 10 2017 12:13:22 GMT+0300 (Belarus Standard Time)","value":104,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Бензин","type":"3","date":"Fri Nov 10 2017 12:14:06 GMT+0300 (Belarus Standard Time)","value":14.18,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Винетка Венгрия","type":"3","date":"Fri Nov 10 2017 12:14:34 GMT+0300 (Belarus Standard Time)","value":2975,"currency":"5","isPaid":true,"partList":[true,true]},{"title":"Жильё Будапешт","type":"2","date":"Fri Nov 10 2017 12:16:35 GMT+0300 (Belarus Standard Time)","value":15000,"currency":"5","isPaid":true,"partList":[true,true]},{"title":"Пиво в Будапеште","type":"4","date":"Fri Nov 10 2017 12:17:06 GMT+0300 (Belarus Standard Time)","value":1500,"currency":"5","isPaid":true,"partList":[true,true]},{"title":"Бензин Будапешт","type":"3","date":"Fri Nov 10 2017 12:18:17 GMT+0300 (Belarus Standard Time)","value":3000,"currency":"5","isPaid":true,"partList":[true,true]},{"title":"Бензин Хорватия","type":"3","date":"Fri Nov 10 2017 12:18:44 GMT+0300 (Belarus Standard Time)","value":210.82,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Платные дороги Хорватия","type":"3","date":"Fri Nov 10 2017 12:20:05 GMT+0300 (Belarus Standard Time)","value":47,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Бензин Хорватия","type":"3","date":"Fri Nov 10 2017 12:20:43 GMT+0300 (Belarus Standard Time)","value":201.76,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Платные дороги Хорватия","type":"3","date":"Fri Nov 10 2017 12:21:39 GMT+0300 (Belarus Standard Time)","value":200,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Покупки в Konzum","type":"0","date":"Fri Nov 10 2017 13:35:49 GMT+0300 (Belarus Standard Time)","value":629.64,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Мороженое и кукуруза","type":"4","date":"Fri Nov 10 2017 13:36:36 GMT+0300 (Belarus Standard Time)","value":17,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Тапки для пляжа","type":"6","date":"Fri Nov 10 2017 13:37:05 GMT+0300 (Belarus Standard Time)","value":60,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Обед в кафе","type":"1","date":"Fri Nov 10 2017 13:40:09 GMT+0300 (Belarus Standard Time)","value":210,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Пекарня","type":"1","date":"Fri Nov 10 2017 13:40:34 GMT+0300 (Belarus Standard Time)","value":13,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Магазин в Омише","type":"1","date":"Fri Nov 10 2017 13:42:07 GMT+0300 (Belarus Standard Time)","value":217.52,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Бензин","type":"3","date":"Fri Nov 10 2017 13:43:18 GMT+0300 (Belarus Standard Time)","value":182.47,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Мороженое и ммдмс","type":"4","date":"Fri Nov 10 2017 13:48:21 GMT+0300 (Belarus Standard Time)","value":17,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Плитвицкие озера","type":"4","date":"Fri Nov 10 2017 13:48:59 GMT+0300 (Belarus Standard Time)","value":540,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Парковка на озерах","type":"3","date":"Fri Nov 10 2017 13:49:57 GMT+0300 (Belarus Standard Time)","value":20,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Еда на озерах","type":"1","date":"Fri Nov 10 2017 13:50:21 GMT+0300 (Belarus Standard Time)","value":215,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Бензин Хорватия","type":"3","date":"Fri Nov 10 2017 13:51:04 GMT+0300 (Belarus Standard Time)","value":187.97,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Платные дороги","type":"3","date":"Fri Nov 10 2017 13:51:43 GMT+0300 (Belarus Standard Time)","value":92,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Магазин","type":"0","date":"Fri Nov 10 2017 13:52:04 GMT+0300 (Belarus Standard Time)","value":45.62,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Пекарня","type":"1","date":"Fri Nov 10 2017 13:53:22 GMT+0300 (Belarus Standard Time)","value":19.5,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Платная парковка","type":"3","date":"Fri Nov 10 2017 13:54:04 GMT+0300 (Belarus Standard Time)","value":70,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Еда конзьюм","type":"1","date":"Fri Nov 10 2017 13:56:21 GMT+0300 (Belarus Standard Time)","value":533.66,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Кепка Виталик","type":"0","date":"Fri Nov 10 2017 13:57:01 GMT+0300 (Belarus Standard Time)","value":50,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Кепка и сувенири Стасикам","type":"5","date":"Fri Nov 10 2017 13:57:27 GMT+0300 (Belarus Standard Time)","value":140,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Пицца в Омише","type":"1","date":"Fri Nov 10 2017 13:59:27 GMT+0300 (Belarus Standard Time)","value":185,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Вход Стасика на башню","type":"4","date":"Fri Nov 10 2017 13:59:56 GMT+0300 (Belarus Standard Time)","value":20,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Водичка и лед в Омише","type":"1","date":"Fri Nov 10 2017 14:01:49 GMT+0300 (Belarus Standard Time)","value":70,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Парковка в Омише","type":"3","date":"Fri Nov 10 2017 14:02:14 GMT+0300 (Belarus Standard Time)","value":70,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Спиртное, шоколад и тд","type":"0","date":"Fri Nov 10 2017 14:02:45 GMT+0300 (Belarus Standard Time)","value":261.88,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Магаз конзьюм в дорогу","type":"0","date":"Fri Nov 10 2017 14:04:12 GMT+0300 (Belarus Standard Time)","value":115.35,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Бензин Хорватия","type":"3","date":"Fri Nov 10 2017 14:04:38 GMT+0300 (Belarus Standard Time)","value":191.74,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Пекарня","type":"1","date":"Fri Nov 10 2017 14:05:11 GMT+0300 (Belarus Standard Time)","value":39,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Винетка Словакия","type":"3","date":"Fri Nov 10 2017 14:05:45 GMT+0300 (Belarus Standard Time)","value":10,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Бензин Хорватия","type":"3","date":"Fri Nov 10 2017 14:06:41 GMT+0300 (Belarus Standard Time)","value":185.57,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Платные дороги","type":"3","date":"Fri Nov 10 2017 14:07:52 GMT+0300 (Belarus Standard Time)","value":248,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Винетка Австрия","type":"3","date":"Fri Nov 10 2017 14:08:16 GMT+0300 (Belarus Standard Time)","value":8.9,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Бензин Австрия","type":"3","date":"Fri Nov 10 2017 14:08:44 GMT+0300 (Belarus Standard Time)","value":15.28,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Бензин Словакия","type":"3","date":"Fri Nov 10 2017 14:09:15 GMT+0300 (Belarus Standard Time)","value":28.67,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Жильё Братислава","type":"2","date":"Fri Nov 10 2017 14:10:29 GMT+0300 (Belarus Standard Time)","value":41,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Бензин Словакия","type":"3","date":"Fri Nov 10 2017 14:10:59 GMT+0300 (Belarus Standard Time)","value":15.38,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Обед Словакия","type":"1","date":"Fri Nov 10 2017 14:11:48 GMT+0300 (Belarus Standard Time)","value":21.2,"currency":"1","isPaid":true,"partList":[true,true]},{"title":"Парковка Краков","type":"3","date":"Fri Nov 10 2017 14:12:51 GMT+0300 (Belarus Standard Time)","value":15,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Мороженое","type":"4","date":"Fri Nov 10 2017 14:14:41 GMT+0300 (Belarus Standard Time)","value":6,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Бензин Польша","type":"3","date":"Fri Nov 10 2017 14:15:06 GMT+0300 (Belarus Standard Time)","value":94.56,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Проживание Варшава","type":"2","date":"Fri Nov 10 2017 14:17:02 GMT+0300 (Belarus Standard Time)","value":37.79,"currency":"0","isPaid":true,"partList":[true,true]},{"title":"Бензин в Польше","type":"3","date":"Fri Nov 10 2017 14:17:31 GMT+0300 (Belarus Standard Time)","value":73.21,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Майка, рубашка, свитер","type":"5","date":"Fri Nov 10 2017 14:17:58 GMT+0300 (Belarus Standard Time)","value":140.3,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Кфс + обед","type":"1","date":"Fri Nov 10 2017 14:18:27 GMT+0300 (Belarus Standard Time)","value":45.4,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Джинсы, свитер, майка","type":"5","date":"Fri Nov 10 2017 14:18:57 GMT+0300 (Belarus Standard Time)","value":119.97,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Майка мустанг","type":"5","date":"Fri Nov 10 2017 14:19:20 GMT+0300 (Belarus Standard Time)","value":34,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Одежда Данику","type":"5","date":"Fri Nov 10 2017 14:20:03 GMT+0300 (Belarus Standard Time)","value":50.48,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Кроссовки Влад","type":"5","date":"Fri Nov 10 2017 14:20:31 GMT+0300 (Belarus Standard Time)","value":140,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Кроссовки Таня","type":"5","date":"Fri Nov 10 2017 14:20:49 GMT+0300 (Belarus Standard Time)","value":162,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Бензин","type":"3","date":"Fri Nov 10 2017 14:22:11 GMT+0300 (Belarus Standard Time)","value":23,"currency":"3","isPaid":true,"partList":[true,true]}],"fixation":{"whom":[],"byBank":[],"reserve":0}},{"meta":{"title":"Мама","participation":1,"preferredCurrency":"3","total":309.14466,"share":1733.058771667,"balance":-1423.914111667,"receivedSum":0,"givenSum":0,"fullBalance":-1423.91,"fullBalanceByBank":0,"expensesByTypes":[213.51,193.2,711.51,393.19,66.01,149.46,6.18]},"expenses":[{"title":"Аушан в Люблине","type":"0","date":"Fri Nov 10 2017 14:22:33 GMT+0300 (Belarus Standard Time)","value":489,"currency":"4","isPaid":true,"partList":[true,true]},{"title":"Суп Хорватия","type":"1","date":"Fri Nov 10 2017 14:23:33 GMT+0300 (Belarus Standard Time)","value":30,"currency":"6","isPaid":true,"partList":[true,true]},{"title":"Аушан Варшава","type":"0","date":"Fri Nov 10 2017 14:23:57 GMT+0300 (Belarus Standard Time)","value":52.29,"currency":"4","isPaid":true,"partList":[true,true]}],"fixation":{"whom":[],"byBank":[],"reserve":0}}]}]}
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
                ],
                commonSurcharge: 0
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