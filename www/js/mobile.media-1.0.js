define('mobile-media', ['jquery', 'mobile-file', 'angular', 'angular-logger'], function ($, FileManager, angular) {
    var injector = angular.injector(['ng', 'angular.logger']);
    var logger = injector.get('Logger').getInstance("media");

    function MediaPlayer() {
        MediaPlayer.prototype.play = function () {
        };
        MediaPlayer.prototype.stop = function () {
        };
        MediaPlayer.prototype.setCallbackError = function (callbackError) {
        };
        MediaPlayer.prototype.setSource = function (src, test) {
        };
        MediaPlayer.prototype.setSpeed = function (speed) {
        };
        MediaPlayer.prototype.setLoopPlay = function (fn) {
        };
    }

    function MobileMediaPlayer() {
        var player;
        var file;
        var callbackError;
        var loop;
        var id = Math.uuid();
        var playerState = 0;

        MobileMediaPlayer.prototype.setCallbackError = function (fn) {
            callbackError = fn;
        };

        MobileMediaPlayer.prototype.setSource = function (src) {
            file = src;
        };

        MobileMediaPlayer.prototype.play = function () {
            if (!isNullOrUndef(player) && player.src != file) {
                player.release();
                player = null;
            }
            if (isNullOrUndef(player)) {
                player = new Media(file,
                    function () {
                        setTimeout(function () {
                            loop();
                        }, 100);
                        //logger.debug('MobileMediaPlayer.succesed media id= {0}, file {1}: ', [id, file]);
                    }, function (error) {
                        //logger.debug('MobileMediaPlayer.error media id = {0}, file {1}: ', [id, file]);
                        switch (error.code) {
                            case MediaError.MEDIA_ERR_ABORTED:
                                callbackError('MediaError.MEDIA_ERR_ABORTED message: ' + error.message);
                                break;
                            case MediaError.MEDIA_ERR_NETWORK:
                                callbackError('MediaError.MEDIA_ERR_NETWORK message: ' + error.message);
                                break;
                            case MediaError.MEDIA_ERR_DECODE:
                                callbackError('MediaError.MEDIA_ERR_DECODE message: ' + error.message);
                                break;
                            case MediaError.MEDIA_ERR_NONE_SUPPORTED:
                                callbackError('MediaError.MEDIA_ERR_NONE_SUPPORTED: ' + error.message);
                                break;
                            default :
                                logger.error('code {0}', [error.code]);
                            //callbackError('code ' + error.code + ', message: ' + error.message);
                        }
                    }, function (status) {
                        playerState = status;
                    });
            }
            player.play();
        };
        MobileMediaPlayer.prototype.stop = function () {
            if (!isNullOrUndef(player)) {
                if (playerState != 4) {
                    player.stop();
                }
                player.release();
            }
        };
        MobileMediaPlayer.prototype.setSpeed = function (speed) {
        };
        MobileMediaPlayer.prototype.setLoopPlay = function (fn) {
            loop = fn;
        };
    }

    function DesktopMediaPlayer() {
        var audio = $("<audio preload=\"none\"/>")
        var loopPlay;
        var identity = new Date().getMilliseconds();

        DesktopMediaPlayer.prototype.setSource = function (src) {
            audio.attr("src", src);
            audio.get(0).load();
        };
        DesktopMediaPlayer.prototype.setSpeed = function (speed) {
            audio.get(0).playbackRate = speed;
        };
        DesktopMediaPlayer.prototype.play = function () {
            audio.unbind();
            audio.bind("ended", function () {
                setTimeout(function () {
                    loopPlay();
                    //logger.debug('DesktopMediaPlayer.succesed media id = {0}: ', [identity]);
                }, 0);
            });
            audio.get(0).play();
        };
        DesktopMediaPlayer.prototype.stop = function () {
            audio.unbind();
            if (!audio.get(0).paused) {
                audio.get(0).pause();
            }
        };
        DesktopMediaPlayer.prototype.setCallbackError = function (callbackError) {
        };
        DesktopMediaPlayer.prototype.setLoopPlay = function (fn) {
            loopPlay = fn;
        };
    }

    function isNullOrUndef(arg) {
        return (arg === null || arg === void (0));
    }

    MobileMediaPlayer.prototype = new MediaPlayer();
    DesktopMediaPlayer.prototype = new MediaPlayer();

    return isMobile ? MobileMediaPlayer : DesktopMediaPlayer;
});
