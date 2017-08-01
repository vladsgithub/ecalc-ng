(function () {
    'use strict';
    angular.module('app', []);
})();

(function (module) {

    var calculatorCtrl = ['$scope', 'getDataService', function($scope, getDataService) {

		$scope.createAccount = function() {
			var accounts = $scope.expCalc.accounts;
			var accountIndex = accounts.length;
			var newAccount = {
				settings: {
					accountCurrency: $scope.expCalc.settings.baseCurrency
				},
				meta: {
                    title: 'Новый расчет', //'Новый расчет ' + accountIndex,
                    total: 0,
                    fullParticipation: 0
				},
				participants: [],
				sponsors: []
			};

			accounts.push(newAccount);

			$scope.createParticipant(accountIndex);
		};

		$scope.createParticipant = function(accountIndex) {
			var participantIndex = $scope.expCalc.accounts[accountIndex].participants.length;
			var newParticipant = {
				meta: {
					title: 'Участник ' + accountIndex + '.' + participantIndex,
					participation: 1,
					preferredCurrency: $scope.expCalc.settings.baseCurrency,
					total: 0
				},
				participationList: [],
				expenses: [],
				fixation: {
					total: 0,
					whom: [], // it will be added objects: { to: participants[x], value: 1, reserve: null, date: null}
					byBank: [] // it will be added objects: { value: null, reserve: null, date: null} (participants can return money by some parts)
				}
			};

			$scope.expCalc.accounts[accountIndex].participants.push(newParticipant);

            $scope.createParticipationList(accountIndex, participantIndex);
			$scope.updateFullParticipation();
		};

        $scope.createParticipationList = function(accountIndex, participantIndex) {
            var participants = $scope.expCalc.accounts[accountIndex].participants;
            var currentParticipationList = participants[participantIndex].participationList;

            participants.forEach(function(item, i, arr) {
                if (i != participantIndex) item.participationList.push([]);
                currentParticipationList.push([]);

                item.expenses.forEach(function(item2, i2, arr2) {
                    currentParticipationList[i].push({
                        value: true,
                        share: null
                    });
                });
            });
        };

        $scope.addNewExpense = function(obj) {
            var accountIndex = obj.$parent.$parent.$index;
            var participantIndex = obj.$index;
            var expenseIndex = obj.participant.expenses.length;
            var newExpense = {
                title: 'Расход ' + accountIndex + '.' + participantIndex + '.' + expenseIndex,
                type: '0',
                date: null,
                value: null,
                currency: obj.$parent.$parent.account.settings.accountCurrency
            };

            obj.participant.expenses.push(newExpense);
            $scope.addValueToParticipationLists(accountIndex, participantIndex);
        };

        $scope.addValueToParticipationLists = function(accountIndex, participantIndex) {
            $scope.expCalc.accounts[accountIndex].participants.forEach(function(item, i, arr) {
                item.participationList[participantIndex].push({
                    value: true,
                    share: null
                });
            });
        };



        $scope.getAccountTotal = function(account) {
            account.meta.total = 0;

            account.participants.forEach(function(participant, i, arr) {
                account.meta.total += participant.meta.total;
            });

            console.log('getAccountTotal');
            return $scope.roundOff(account.meta.total);
		};

        $scope.getParticipantTotal = function(account, participant) {
        	var rates = $scope.expCalc.settings.currencies.rates[account.settings.accountCurrency];

            participant.meta.total = 0;

            participant.expenses.forEach(function(expense, i, arr) {
                participant.meta.total += expense.value * rates[expense.currency];
            });

            console.log('getParticipantTotal');
            return $scope.roundOff(participant.meta.total);
		};




		$scope.updateData = function(obj) {
			if (obj.expense.value >= 0) {
                if (!obj.expense.date) obj.expense.date = '' + new Date();
			} else {
                obj.expense.value = 0;
			}
		};




		$scope.updateFullParticipation = function() {
            var account = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];
            account.meta.fullParticipation = 0;

			account.participants.forEach(function(item, i, arr) {
                account.meta.fullParticipation += item.meta.participation;
			});
		};

		$scope.updateShare = function(participantIndex, expenseIndex) {
            var account = $scope.expCalc.accounts[$scope.expCalc.settings.currentAccount];

            account.participants.forEach(function(item, i, arr) {
                // item.participationList[][]
                // item.expenses.forEach(function(item2, i, arr) {
                	//
				// });
			});
        };

		$scope.getShare = function(participantIndex, expenseIndex) {
            // {{participant.participationList[participantIndex][expenseIndex].value}} *
            // {{participant.meta.participation}} *
            // {{account.participants[participantIndex].expenses[expenseIndex].value}} *
            // {{expCalc.settings.currencies.rates[accountCurrency][account.participants[participantIndex].expenses[expenseIndex].currency]}} /
			// fullParticipation
		};

		$scope.updateCalculation= function(value) {
			// console.log(value);
		};

		$scope.roundOff = function(value) {
			if (value === undefined) return 0;
			return Math.round(value * 100) / 100;
		};

		$scope.formatDate = function(value) {
			if (value) {
				value = new Date(value);

                return value.toLocaleString();
			} else {
				return '';
			}
		};




		$scope.removeAccount = function(obj) {
			$scope.expCalc.accounts.splice(obj.$index, 1);
		};

		$scope.removeParticipant = function(obj) {
			var accountIndex = obj.$parent.$parent.$index;
			var participantIndex = obj.$index;

			$scope.expCalc.accounts[accountIndex].participants.splice(participantIndex, 1);
			$scope.removeArrayFromParticipationLists(accountIndex, participantIndex);
            $scope.updateFullParticipation();
		};

		$scope.removeExpense = function(obj) {
			var accountIndex = obj.$parent.$parent.$parent.$index;
			var participantIndex = obj.$parent.$index;
			var expenseIndex = obj.$index;

			$scope.expCalc.accounts[accountIndex].participants[participantIndex].expenses.splice(expenseIndex, 1);
			$scope.removeValueFromParticipationLists(accountIndex, participantIndex, expenseIndex);
		};

		$scope.removeArrayFromParticipationLists = function(accountIndex, participantIndex) {
			$scope.expCalc.accounts[accountIndex].participants.forEach(function(item, i, arr) {
				item.participationList.splice(participantIndex, 1);
			});
		};

		$scope.removeValueFromParticipationLists = function(accountIndex, participantIndex, expenseIndex) {
			$scope.expCalc.accounts[accountIndex].participants.forEach(function(item, i, arr) {
				item.participationList[participantIndex].splice(expenseIndex, 1);
			});
		};



		$scope.$watch('expCalc',function(newValue, oldValue){
			localStorage.setItem('expensesCalc', JSON.stringify(newValue));


            document.getElementById('testing').innerHTML = JSON.stringify(newValue)
                .replace(/\[/g, "[<div>").replace(/]/g, "</div>]")
                .replace(/{/g, "{<div>").replace(/}/g, "</div>}")
				.replace(/,/g, ",<hr>").replace(/:/g, ": ")
                .replace(/},<hr>{/g, "},{").replace(/],<hr>\[/g, "],[")
                .replace(/],\[/g, "<ar>],[</ar>").replace(/},{/g, "<arr>},{</arr>")
				.replace(/"participants": \[/g, "<b>\"participants\": [</b>")
                .replace(/"currencies": {<div>/g, "\"currencies\": {<div class='compressed'>")
                .replace(/"expensesTypes": \[<div>/g, "\"expensesTypes\": [<div class='compressed'>");

            document.getElementById('testing').querySelectorAll('div').forEach(function(item, i) {
            	item.addEventListener('click', function(e) {
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


(function(module) {

    var getDataService = function() {
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
				{ name: 'Общие расходы', icon: ''},
				{ name: 'Продукты питания', icon: ''},
				{ name: 'Жильё', icon: ''},
				{ name: 'Машина', icon: ''},
				{ name: 'Развлечение', icon: ''}
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