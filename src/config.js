/**
 * Configuration file
 *
 * Copy this file to config.js and edit to suit your preferences.
 */
var Options = {
  server: {
    trace :         true,
    trusted:        true,

    servers: [
      { host: 's-west.ripple.com', port: 443, secure: true },
      { host: 's-east.ripple.com', port: 443, secure: true }
    ],

    connection_offset: 1
  },
  markets: [
    {
      name: 'US Dollars',
      currency: 'USD',
      priority: 1,
      gateways: {
        Bitstamp: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    },
    {
      name: 'Bitcoin',
      currency: 'BTC',
      priority: 2,
      gateways: {
        Bitstamp: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    },
    {
      name: 'Chinese Yuan',
      currency: 'CNY',
      priority: 3,
      gateways: {
        RippleFox: 'rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y'
      }
    },
    {
      name: 'Japanese Yen',
      currency: 'JPY',
      priority: 4,
      gateways: {
        MrRipple: 'rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS'
      }
    }
  ],
  orderbookFilterOpts: {
    precision: 5,
    min_precision: 5,
    max_sig_digits: 20
  },
  pageTitlePriceOpts: {
    precision: 2,
    min_precision: 2
  }
};
