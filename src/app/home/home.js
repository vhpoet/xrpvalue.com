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

.controller( 'HomeCtrl', function HomeController( $scope, $rootScope, titleService, $filter ) {
  var rpamountFilter = $filter('rpamount');
  var remote = new ripple.Remote(Options.server);

  $scope.orderbooks = {};

  /**
   * Taken from ripple client books.js
   *
   * @param data
   * @param action
   * @param combine
   * @returns {*}
   */
  function filterRedundantPrices(data, action, combine) {
    var max_rows = Options.orderbook_max_rows || 100;

    var price;
    var lastprice;
    var current;
    var rpamount = $filter('rpamount');
    var numerator;
    var demoninator;
    var newData = jQuery.extend(true, {}, data);

    var rowCount = 0;
    newData = _.values(_.compact(_.map(newData, function(d, i) {

      // This check is redundant, but saves the CPU some work
      if (rowCount > max_rows) return false;

      // prefer taker_pays_funded & taker_gets_funded
      if (d.hasOwnProperty('taker_gets_funded')) {
        d.TakerGets = d.taker_gets_funded;
        d.TakerPays = d.taker_pays_funded;
      }

      d.TakerGets = ripple.Amount.from_json(d.TakerGets);
      d.TakerPays = ripple.Amount.from_json(d.TakerPays);

      d.price = ripple.Amount.from_quality(d.BookDirectory, "1", "1");

      if (action !== "asks") d.price = ripple.Amount.from_json("1/1/1").divide(d.price);

      // Adjust for drops: The result would be a million times too large.
      if (d[action === "asks" ? "TakerPays" : "TakerGets"].is_native())
        d.price  = d.price.divide(ripple.Amount.from_json("1000000"));

      // Adjust for drops: The result would be a million times too small.
      if (d[action === "asks" ? "TakerGets" : "TakerPays"].is_native())
        d.price  = d.price.multiply(ripple.Amount.from_json("1000000"));

      var price = rpamount(d.price, {
        rel_precision: 4,
        rel_min_precision: 2
      });

      if (lastprice === price) {
        if (combine) {
          newData[current].TakerPays = ripple.Amount.from_json(newData[current].TakerPays).add(d.TakerPays);
          newData[current].TakerGets = ripple.Amount.from_json(newData[current].TakerGets).add(d.TakerGets);
        }
        d = false;
      } else current = i;
      lastprice = price;

      if (d) rowCount++;

      if (rowCount > max_rows) return false;

      return d;
    })));

    var key = action === "asks" ? "TakerGets" : "TakerPays";
    var sum;
    _.each(newData, function (order, i) {
      if (sum) sum = order.sum = sum.add(order[key]);
      else sum = order.sum = order[key];
    });

    return newData;
  }

  var handleBook = function(orders,action) {
    orders = filterRedundantPrices(orders,action,true);

    // TODO fix
    orders = orders.splice(0,20);

    orders.forEach(function(order,index){
      order.showSum = rpamountFilter(order.sum,Options.orderbookFilterOpts);
      order.showPrice = rpamountFilter(order.price,Options.orderbookFilterOpts);

      var showValue = action === 'bids' ? 'TakerPays' : 'TakerGets';
      order['show' + showValue] = rpamountFilter(order[showValue],Options.orderbookFilterOpts);
    });

    return orders;
  };

  // Start getting market data
  var getData = function () {
    // Currencies
    Options.markets.forEach(function(market){
      var currency = market.currency;

      if (!$scope.orderbooks[currency]) {
        $scope.orderbooks[currency] = {
          name: market.name,
          priority: market.priority,
          currency: market.currency,
          gateways: {}
        };
      }

      // Gateways
      _.each(market.gateways, function(issuer,gateway){
        if (!$scope.orderbooks[currency].gateways[gateway]) {
          $scope.orderbooks[currency].gateways[gateway] = {
            books: {
              asks: {orders:[]},
              bids: {orders:[]}
            }
          };
        }

        ['asks','bids'].forEach(function(action){
          var book = action == 'asks'
              ? remote.book(currency, issuer, 'XRP', null)
              : remote.book('XRP', null, currency, issuer);

          book.on('model',function(orders){
            $scope.$apply(function(){
              var bookData = $scope.orderbooks[currency].gateways[gateway].books[action];
              bookData.orders = handleBook(orders,action);

              if (bookData.price) bookData.lastPrice = bookData.price;

              bookData.price = bookData.orders[0].price;
              bookData.flipPrice = ripple.Amount.from_human(1).divide(bookData.orders[0].price);

              var lastDirection = bookData.direction;

              if (bookData.lastPrice && bookData.lastPrice != bookData.price) {
                bookData.direction = bookData.lastPrice < bookData.price ? 'up' : 'down';
              }

              if (!bookData.direction) {
                bookData.direction = lastDirection;
              }

              // ahh
              $scope.orderbooksArray = _.toArray($scope.orderbooks);
            })
          })
        })
      })
    });
  };

  remote.on('connected',function(){
    console.log('connected');

    getData();
  });
  remote.connect();

  $scope.$watch('orderbooks.USD.gateways.Bitstamp.books.asks.price',function(price){
    if (price) {
      var books = $scope.orderbooks.USD.gateways.Bitstamp.books;

      if (books.bids.price && books.asks.price)
        titleService.setTitle(books.bids.price.to_human(Options.pageTitlePriceOpts)
          + '/' + books.asks.price.to_human(Options.pageTitlePriceOpts));
    }
  });

  $scope.$watch('orderbooks.USD.gateways.Bitstamp.books.bids.price',function(price){
    if (price) {
      var books = $scope.orderbooks.USD.gateways.Bitstamp.books;

      if (books.bids.price && books.asks.price)
        titleService.setTitle(books.bids.price.to_human(Options.pageTitlePriceOpts)
          + '/' + books.asks.price.to_human(Options.pageTitlePriceOpts));
    }
  });
});
