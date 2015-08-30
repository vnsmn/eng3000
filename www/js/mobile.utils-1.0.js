define('mobile-utils', ['jquery', 'block-ui'], function ($) {
    function Utils() {
    }

    Utils.isNullOrUndef = function (arg) {
        return arg === null || arg === void (0);
    };

    Utils.invokeLate = function(stateFn, fn, delay) {
        var wrapper;
        var prevState = stateFn();
        setTimeout(wrapper = function() {
            var state = stateFn();
            if (prevState == state) {
                fn();
            } else {
                prevState = state;
                setTimeout(wrapper, delay);
            }
        }, delay);
    };

    Utils.toString = function (arg, def) {
        return Utils.isNullOrUndef(arg) ? def : '' + arg;
    };

    Utils.blockUI = function () {
        setTimeout(function () {
            $.blockUI({
                message: '<span style="font-size: small">Please wait...</span>',
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: '#000',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    opacity: .5,
                    color: '#fff',
                    'font-size': 'smaller',
                    cursor: 'wait'
                }
            });
        }, 0);
    };

    Utils.unblockUI = function () {
        setTimeout($.unblockUI, 500);
    };

    return Utils;
});
