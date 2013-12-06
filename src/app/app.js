require('underscore');
require('./home/home');

var moment = require('moment');

angular.module( 'xrpvalue', [
  'ngResource',
  'ui.state',
  'ui.route',
  'ui.bootstrap',
  'templates-app',
  'templates-common',
  'templates-jade_app',
  'templates-jade_common',
  'xrpvalue.home'
])

.config(function config($locationProvider) {
  $locationProvider.html5Mode(true);
})

.run(['titleService', function (titleService)
{
  
}])

.controller( 'AppCtrl', function AppCtrl ( $scope ) {

})

/**
 * Get the currency from an Amount.
 */
.filter('rpcurrency', function () {
  return function (input) {
    if (!input) return "";

    var amount = ripple.Amount.from_json(input);
    return amount.currency().to_json();
  };
})

/**
 * Format a ripple.Amount.
 *
 * If the parameter is a number, the number is treated the relative
 */
.filter('rpamount', function () {
  return function (input, opts) {
    if ("number" === typeof opts) {
      opts = {
        rel_min_precision: opts
      };
    } else if ("object" !== typeof opts) {
      opts = {};
    }

    if (!input) return "n/a";

    if (opts.xrp_human && input === ("" + parseInt(input, 10))) {
      input = input + ".0";
    }

    var amount = ripple.Amount.from_json(input);
    if (!amount.is_valid()) return "n/a";

    // Certain formatting options are relative to the currency default precision
    if ("number" === typeof opts.rel_precision) {
      opts.precision = 4 + opts.rel_precision;
    }
    if ("number" === typeof opts.rel_min_precision) {
      opts.min_precision = 4 + opts.rel_min_precision;
    }

    // If no precision is given, we'll default to max precision.
    if ("number" !== typeof opts.precision) {
      opts.precision = 16;
    }

    // But we will cut off after five significant decimals
    if ("number" !== typeof opts.max_sig_digits) {
      opts.max_sig_digits = 5;
    }

    var out = amount.to_human(opts);

    return out;
  };
})

.directive('rpBindColorAmount', function () {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.$watch(attr.rpBindColorAmount, function(value){
          var parts = value.split(".");
          var decimalPart;
          if (parts[1])
            decimalPart = parts[1].replace(/0(0+)$/, '0<span class="insig">$1</span>');

          // TODO sometimes no decimalpart.. maybe because sum is empty
          element[0].innerHTML = decimalPart && decimalPart.length > 0 ? parts[0] + "." + decimalPart : parts[0];
        });
      };
    }
  };
});