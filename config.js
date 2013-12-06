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
      { host: 's_west.ripple.com', port: 443, secure: true },
      { host: 's_east.ripple.com', port: 443, secure: true }
    ],

    connection_offset: 1
  }
};