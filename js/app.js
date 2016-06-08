/*jslint browser this*/
/*global angular window cordova StatusBar FileUploadOptions FileTransfer*/
(function () {
    var app = angular.module('starter', ['ionic']);

    app.run(function ($ionicPlatform, $rootScope, $state) {
        $rootScope.goTo = function (page) {
            $state.go(page);
        };
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    });
    app.config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('connection', {
                cache: true,
                url: '/connection',
                templateUrl: 'views/connection.html',
                controller: 'connectCtrl'
            })
            .state('register', {
                cache: true,
                url: '/register',
                templateUrl: 'views/register.html',
                controller: 'registerCtrl'
            })
            .state('home', {
                cache: true,
                url: '/home',
                templateUrl: 'views/home.html',
                controller: 'snapController'
            })
            .state('snap', {
                cache: true,
                url: '/snap',
                templateUrl: 'views/snap.html',
                controller: 'snapController'
            })
            .state('users', {
                cache: true,
                url: '/users',
                templateUrl: 'views/users.html',
                controller: 'receiverCtrl'
            })
            .state('mySnaps', {
                cache: true,
                url: '/mySnaps',
                templateUrl: 'views/mySnaps.html',
                controller: 'mySnapsCtrl'
            })
            .state('mySnap', {
                cache: true,
                url: '/mySnap',
                templateUrl: 'views/mySnap.html',
                controller: 'mySnapsCtrl'
            })
            .state('time', {
                cache: true,
                url: '/time',
                templateUrl: 'views/time.html',
                controller: 'timeCtrl'
            });
        $urlRouterProvider.otherwise('/connection');
    });

    app.service('globals', function () {
        var variables = {
            receiver: '',
            image: '',
            fileUrl: ''
        };
        return {
            getProperty: function (name) {
                return variables[name];
            },
            setProperty: function (name, val) {
                variables[name] = val;
            }
        };
    });

    var user = (localStorage.getItem('user'))
        ? JSON.parse(localStorage.getItem('user'))
        : '';
    /*******************CONNECTION**********************/
    app.controller('connectCtrl', ['$http', '$scope', '$state', function ($http, $scope, $state) {
        $scope.user = {};
        if (localStorage.getItem('user')) {
            $state.go('home');
        }
        $scope.connect = function (form) {
            if (form.$valid) {
                $http.post('http://snapchat.samsung-campus.net/api.php?option=connexion', $scope.user).success(function (response) {
                    if (response.error === true) {
                        user = {id: JSON.parse(response.data).id, email: $scope.user.email, token: response.token, password: $scope.user.password};
                        if ($scope.user.connected === true) {
                            localStorage.setItem('user', JSON.stringify(user));
                        }
                        $state.go('home');
                    }
                });
            }
        };
    }]);
    /************************REGISTRATION****************************/
    app.controller('registerCtrl', ['$http', '$scope', '$state', function ($http, $scope, $state) {
        $scope.user = {};
        $scope.register = function (form) {
            if (form.$valid) {
                $http.post('http://snapchat.samsung-campus.net/api.php?option=inscription', $scope.user).success(function (data) {
                    if (data.error === true) {
                        $state.go('connection');
                    }
                });
            }
        };
    }]);

    app.controller('receiverCtrl', ['$http', '$scope', '$state', 'globals', function ($http, $scope, $state, globals) {
        var param = {email: user.email, token: user.token};
        $http.post('http://snapchat.samsung-campus.net/api.php?option=toutlemonde', param).success(function (response) {
            $scope.users = JSON.parse(response.data);
        });
        $scope.setReceiver = function (id) {
            globals.setProperty('receiver', id);
            $state.go('time');
        };
    }]);

    app.controller('timeCtrl', ['$scope', '$state', 'globals', function ($scope, $state, globals) {
        $scope.changeTime = function (type) {
            var time = document.getElementById('time');
            var htmlTime = time.innerHTML;
            if (type === 'minus' && JSON.parse(htmlTime) > 1) {
                time.innerHTML = parseInt(htmlTime) - 1;
            } else if (type === 'plus' && JSON.parse(htmlTime) < 10) {
                time.innerHTML = parseInt(htmlTime) + 1;
            }
        };
        var win = function () {
            window.alert('Snap successfully sent');
            $state.go('home');
        };
        var fail = function () {
            window.alert('Snap failed to send');
        };

        $scope.send = function () {
            var timer = document.getElementById('time').innerHTML;
            if (timer < 30 && timer > 5) {
                var options = new FileUploadOptions();
                options.fileKey = "file";
                options.mimeType = "image/jpeg";
                var params = {email: user.email, u2: globals.getProperty('receiver'), temps: timer, token: user.token};
                options.params = params;
                var ft = new FileTransfer();
                ft.upload(globals.getProperty('fileUrl'), encodeURI('http://snapchat.samsung-campus.net/api.php?option=image'), win, fail, options);
            }
        };
    }]);

    app.controller('mySnapsCtrl', ['$http', '$scope', '$state', function ($http, $scope, $state) {
        var param = {email: user.email, token: user.token};
        var getMySnaps = function () {
            $http.post('http://snapchat.samsung-campus.net/api.php?option=newsnap', param).success(function (response) {
                $scope.snaps = JSON.parse(response.data);
            });
        };

        getMySnaps();
        $scope.getMySnaps = function () {
            $state.go('mySnaps');
        };

        $scope.displayMySnap = function (snap) {
            var promise = $state.go('mySnap');
            promise.then(function () {
                var count = document.getElementById('count');
                $scope.time = snap.duration;
                document.getElementById('image').src = snap.url;
                count.innerHTML = snap.duration;
                var i = 1;
                var timer;
                timer = setInterval(function () {
                    if (i === parseInt(snap.duration)) {
                        var param2 = {email: user.email, token: user.token, id: snap.id_snap};
                        $http.post('http://snapchat.samsung-campus.net/api.php?option=vu', param2).success(function () {
                            clearInterval(timer);
                            getMySnaps();
                            $state.go('mySnaps');
                        });
                    }
                    i += 1;
                    document.getElementById('count').innerHTML = parseInt(count.innerHTML) - 1;
                }, 1000);
            });
        };
    }]);

    app.controller('snapController', ['$scope', '$state', 'globals', function ($scope, $state, globals) {
        $scope.wallah = function () {
            $state.go('snap');
        };
        var photo = {
            pictureSrc: '',
            destType: '',
            init: function () {
                this.addListeners();
            },
            addListeners: function () {
                document.addEventListener("deviceready", this.onDeviceReady, false);
            },
            onDeviceReady: function () {
                this.pictureSrc = navigator.camera.PictureSourceType;
                this.destType = navigator.camera.DestinationType;
            },
            onPhotoSuccess: function (imageURI) {
                var promise = $state.go('snap');
                promise.then(function () {
                    var image = document.getElementById('image');
                    image.style.display = 'block';
                    globals.setProperty('fileUrl', imageURI);
                    image.src = imageURI;
                });
            },
            onFail: function () {
                window.alert('Failed to take picture');
            },
            takePhoto: function () {
                navigator.camera.getPicture(this.onPhotoSuccess, this.onFail, {quality: 40, destinationType: this.destType.DATA_URL, correctOrientation: true});
            },
            getPhoto: function () {
                navigator.camera.getPicture(this.onPhotoURISuccess, this.onFail, {quality: 40, destinationType: this.destinationType.FILE_URI, sourceType: this.pictureSrc});
            }
        };
        photo.init();
        $scope.photo = photo;
    }]);
    // app.directive('myCamera', function () {
    //     return {
    //         restrict: 'EA',
    //         replace: true,
    //         template: '<button>Take photo </button>',
    //         // scope: { title: '=expanderTitle' },
    //         link: function (scope) {
    //             console.log(scope);
    //         }
    //     }
    // });
}());
