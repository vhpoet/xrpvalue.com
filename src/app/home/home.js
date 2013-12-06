angular.module( 'xrpvalue.home', [
  'titleService'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'home', {
    url: '/',
    views: {
      "main": {
        controller: 'HomeCtrl',
        templateUrl: 'home/home.html'
      }
    }
  });
})

.controller( 'HomeCtrl', function HomeController( $scope, $rootScope, titleService ) {
  titleService.setTitle('Home');

  // TODO FIX EVERYTHING!!!

  $scope.prices = {};
  $scope.priceHistory = {};

  var server = {
    "trusted" : true,
    "websocket_ip" : "s_west.ripple.com",
    "websocket_port" : 443,
    "websocket_ssl" : true
  };

  var remote = new ripple.Remote(server);
  var book;

  var pairsDollars = {
    bitstamp: {
      first: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      second: {
        currency: 'XRP',
        issuer: null
      }
    },
    snapswap: {
      first: {
        currency: 'USD',
        issuer: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'
      },
      second: {
        currency: 'XRP',
        issuer: null
      }
    }
  };

  var pairsYuan = {
    RippleCN: {
      first: {
        currency: 'CNY',
        issuer: 'rnuF96W4SZoCJmbHYBFoJZpR8eCaxNvekK'
      },
      second: {
        currency: 'XRP',
        issuer: null
      }
    },
    RippleChina: {
      first: {
        currency: 'CNY',
        issuer: 'razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA'
      },
      second: {
        currency: 'XRP',
        issuer: null
      }
    }
  };

  var getBook = function (first,second) {
    return remote.book(first.currency, first.issuer,
        second.currency, second.issuer);
  };

  var getPrices = function(curr,pairs) {
    $scope.prices[curr] = {};
    $scope.priceHistory[curr] = {};
    _.each(pairs, function(pair,name){
      $scope.prices[curr][name] = {};
      $scope.priceHistory[curr][name] = {};

      ['asks','bids'].forEach(function(action){
        if (!$scope.priceHistory[curr][name][action])
          $scope.priceHistory[curr][name][action] = [];

        var book = action == 'asks'
            ? getBook(pair.first,pair.second)
            : getBook(pair.second,pair.first);

        book.on('model',function(book){
          $scope.$apply(function(){
            console.log(action + ' update');

            var order = book[0];

            order.TakerGets = ripple.Amount.from_json(order.TakerGets);
            order.TakerPays = ripple.Amount.from_json(order.TakerPays);

            order.price = ripple.Amount.from_quality(order.BookDirectory, "1", "1");

            if (action !== "asks") order.price = ripple.Amount.from_json("1/1/1").divide(order.price);

            // Adjust for drops: The result would be a million times too large.
            if (order[action === "asks" ? "TakerPays" : "TakerGets"].is_native())
              order.price = order.price.divide(ripple.Amount.from_json("1000000"));

            // Adjust for drops: The result would be a million times too small.
            if (order[action === "asks" ? "TakerGets" : "TakerPays"].is_native())
              order.price = order.price.multiply(ripple.Amount.from_json("1000000"));

            var price = order.price.to_human({precision:2});
            var history = $scope.priceHistory[curr][name][action];
            var direction, lastPrice;

            // Store price change history
            if (history.length) {
              lastPrice = history[history.length - 1];

              if (lastPrice != price) {
                direction = lastPrice < price ? 'up' : 'down';

                $scope.priceHistory[curr][name][action].push(price);
              }
            } else {
              $scope.priceHistory[curr][name][action].push(price);
            }

            if (!direction && $scope.prices[curr][name][action]) {
              direction = $scope.prices[curr][name][action].direction;
            }

            $scope.prices[curr][name][action] = {
              'price': price,
              'direction': direction,
              'change': lastPrice ? lastPrice == price : true
            };

            $scope.loaded = true;
          })
        })
      })
    })
  };

  remote.on('connected',function(){
    console.log('connected');

    getPrices('dollar',pairsDollars);
    getPrices('yuan',pairsYuan);
  });
  remote.connect();
});
