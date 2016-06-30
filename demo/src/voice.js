/**
 * @file movice
 * @author cgzero[cgzero@cgzero.com]
 * @data 2016-05-30
 */

define(function (require) {
    var dom = require('saber-dom');
    var mvoice = require('../../src/mvoice');

    var exports = {};

    function initVoice() {
        mvoice.init({
            trigger: '#search-btn',
            oncomplete: function (result) {
                var input = dom.g('search-input');
                input.value = result;
            }
        });
    }

    exports.init = function () {
        initVoice();
    };

    return exports;
});
