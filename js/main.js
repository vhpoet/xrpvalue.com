var server = {
  "trusted" : true,
  "websocket_ip" : "s_west.ripple.com",
  "websocket_port" : 443,
  "websocket_ssl" : true
};

var remote = new ripple.Remote(server);
var book;

var pair = {
  first: {
    currency: 'USD',
    issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' // Bitstamp
  },
  second: {
    currency: 'XRP',
    issuer: null
  }
};

var getBook = function (first,second) {
  return remote.book(first.currency, first.issuer,
    second.currency, second.issuer);
};

remote.on('connected',function(){
  console.log('connected');

  ['asks','bids'].forEach(function(action){
    var book = action == 'asks'
      ? getBook(pair.first,pair.second)
      : getBook(pair.second,pair.first);

    book.on('model',function(book){
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

      $('#' + action).html(order.price.to_human({precision:2}));
    })
  })
});
remote.connect();