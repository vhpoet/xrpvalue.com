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
  titleService.setSuffix( ' | xrpvalue' );
}])

.controller( 'AppCtrl', function AppCtrl ( $scope ) {

});

