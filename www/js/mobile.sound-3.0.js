define('mobile-sound', ['jquery', 'mobile-file', 'mobile-iterator', 'mobile-media'],
    function ($, FileManager, Iterator, MediaPlayer) {

    function SoundManager() {
        var $prev = {background: null, color: null, source: null};
        var $queue = [];
        var $sources;
        var $filter;
        var $callbackError;
        var $speed;
        var self = this;
        var state = 'stop';

        this.setSources = function(sources) {
            $sources = sources;
        };
        this.setSpeed = function(speed) {
            $speed = speed;
            $queue.every(function (context) {
                context.player.setSpeed(speed);
                return true;
            });
        };
        this.setFilter = function(filter) {
            $filter = filter;
            $queue.every(function (context) {
                context.filter = filter;
                return true;
            });
        };
        this.setCallbackError = function(callbackError) {
            $callbackError = callbackError;
        };

        this.play = function () {
            var iterator = new Iterator($sources);
            var player = new MediaPlayer();
            var context = {
                iterator: iterator,
                player: player,
                filter: $filter,
                error: $callbackError
            };
            $queue.push(context);
            player.setCallbackError($callbackError);
            player.setSpeed($speed);
            player.setLoopPlay(function() {
                loopPlay.call(self, context, false);
            });
            loopPlay.call(self, context, true);
            state = 'play';
        };

        this.stop = function () {
            $queue.every(function (context) {
                context.iterator.setInterrupt();
                context.player.stop();
                return true;
            });
            $queue.splice(0, $queue.length);
            state = 'stop';
        };

        this.pause = function () {
            if ($queue.length > 0 && state == 'play') {
                $queue.every(function (context) {
                    context.iterator.setInterrupt();
                    context.player.stop();
                    return true;
                });
                state = 'pause';
            }
        };

        this.resume = function () {
            if ($queue.length > 0 && state == 'pause') {
                $queue.every(function (context) {
                    context.iterator.resetInterrupt();
                    context.player.play();
                    return true;
                });
                state = 'play';
            }
        };

        this.getState = function() {
            return state;
        };

        var loopPlay = function (context, isStart) {
            var source = null;
            var limit = context.iterator.array.length;
            if (!context.iterator.hasNext()) {
                context.iterator.reset();
            }
            while (context.iterator.hasNext()) {
                source = context.iterator.next();
                if (source == null) {
                    break;
                }
                if ((source.key & context.filter) == source.key && source.enabled) {
                    break;
                }
                if (limit == 0) {
                    source = null;
                    break;
                }
                if (!context.iterator.hasNext() && limit > 0) {
                    context.iterator.reset();
                }
                limit--;
            }
            if (!isNullOrUndef($prev.source)) {
                $('span[name="' + $prev.source.traceID + '"]').css("color", $prev.color);
                $('span[name="' + $prev.source.traceID + '"]').css("background-color", $prev.background);
            }
            if (source == null) {
                return null;
            }

            jumpToAnchor.call(this, source.jumpID);
            var element = $('span[name="' + source.traceID + '"]');
            $prev.source = source;
            $prev.background = element.css("background-color");
            $prev.color = element.css("color");
            element.css("color", "blue");
            element.css("background-color", "lightyellow");

            context.player.setSource(source.src, context.iterator.date);
            new FileManager().readTextFile(source.src, function () {
                if (isStart) {
                    context.player.play();
                } else {
                    setTimeout(function () {
                        context.player.play();
                    }, source.delay * 1000);
                }
            }, context.error);
        };

        var jumpToAnchor = function (jumpID) {
            var el = $('a[name="' + jumpID + '"]');
            if (isNullOrUndef(el.get(0))) {
                return;
            }
            var target_top = el.offset().top;
            $('html, body').animate({
                scrollTop: target_top
            }, 'slow');
        };
    }

    function Source(key, src, traceID, jumpID, delay) {
        this.src = src;
        this.traceID = traceID;
        this.jumpID = jumpID;
        this.delay = delay;
        this.key = key;
        this.enabled = true;
    }

    function isNullOrUndef(arg) {
        return (arg === null || arg === void (0));
    }

    return {
        SoundManager: SoundManager,
        Source: Source
    };
});
