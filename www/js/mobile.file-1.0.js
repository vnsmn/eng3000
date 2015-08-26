var isMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));

define('mobile-file', ['jquery'], function ($) {
    function FileManager() {
    }
    FileManager.prototype.onError = function (error) {
        console.log('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    };
    FileManager.prototype.initialize = function (cnfUrl, callback) {
    };
    FileManager.prototype.readTextFile = function (url, callback, callbackError) {
    };
    FileManager.prototype.resolveFilePath = function (url, dirName) {
    };

    function FileDesktopManager() {
    };
    FileDesktopManager.prototype.initialize = function (callback) {
        callback();
    };
    FileDesktopManager.prototype.resolveFilePath = function (url, dirName) {
        return 'resources/' + url;
    };
    FileDesktopManager.prototype.readTextFile = function (url, callback, callbackError) {
        $.get(url)
            .done(function (data) {
                callback(data);
            }).fail(function () {
                if (!isNullOrUndef(callbackError)) {
                    callbackError('Not Found ' + url);
                }
                console.log('Not Found ' + url);
            })
    };

    function FileMobileManager() {
    }
    FileMobileManager.prototype.initialize = function (callback) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            callback();
        }, this.onError)
    };
    FileMobileManager.prototype.resolveFilePath = function (url, dirName) {
        var path = !isNullOrUndef(dirName) && dirName.replace(" ", "") != ""
            ? cordova.file.externalRootDirectory + dirName.replace(' ', '') + "/" + url
            : cordova.file.applicationDirectory + "www/resources/" + url;
        //console.log("resolveFilePath url: " + url + ", dirName: " + dirName + ", path: " + path);
        //console.log("cordova.file.applicationDirectory: " + cordova.file.applicationDirectory);
        //console.log("cordova.file.externalRootDirectory: " + cordova.file.externalRootDirectory);
        return path;
    };
    FileMobileManager.prototype.readTextFile = function (url, callback, callbackError) {
        window.resolveLocalFileSystemURL(url, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    callback(evt.target.result);
                };
                reader.readAsText(file);
            })
        }, function (error) {
            console.log('not found ' + url);
            if (!isNullOrUndef(callbackError)) {
                callbackError('not found ' + url);
            }
        })
    };
    FileMobileManager.prototype.onError = function (error) {
        var text = 'code: ' + error.code + '\n' +
            'message: ' + error.message + '\n';
        console.log(text);
    };

    function isNullOrUndef(arg) {
        return (arg === null || arg === void (0));
    };

    FileManager.prototype = isMobile ? new FileMobileManager() : new FileDesktopManager();

    return FileManager;
});