/**
 * @file movice
 * @author cgzero[cgzero@cgzero.com]
 * @data 2016-05-30
 */

define(function (require) {

    var wx = require('wx');
    var dom = require('saber-dom');
    var env = require('saber-env');
    var ajax = require('saber-ajax').ejson;
    var Tap = require('saber-tap');
    var VoiceDialog = require('./VoiceDialog');

    /**
     * 获取微信配置参数的url
     *
     * @const
     * @type {string}
     */
    var URL_GET_WX_PARAM = '/mock/getweixinconfigajax.php';

    var exports = {};

    // 微信语音本地id
    var voiceLocalId;

    var userMedia;

    window.URL = window.URL
        || window.webkitURL
        || window.msURL
        || window.oURL;

    window.AudioContext = window.AudioContext
        || window.webkitAudioContext
        || window.mozAudioContext;

    navigator.getUserMedia = navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia;

    /**
     * 微信 api 配置
     *
     * @param {Object} opts 配置对象
     * @param {string} opts.appId 公众号的 appid
     * @param {number} opts.timestamp 生成签名的时间戳
     * @param {string} opts.nonceStr 生成签名的随机串
     * @param {string} opts.signature 签名
     */
    function wxConfig(opts) {
        wx.config({
            debug: 0,
            appId: opts.appId,
            timestamp: opts.timestamp,
            nonceStr: opts.nonceStr,
            signature: opts.signature,
            jsApiList: [
                'checkJsApi',
                'translateVoice',
                'startRecord',
                'stopRecord',
                'onRecordEnd',
                'playVoice',
                'pauseVoice',
                'stopVoice',
                'uploadVoice',
                'downloadVoice'
            ]
        });
    }

    /**
     * 获取微信参数，用于调取微信接口
     *
     * @inner
     * @param {Function} callback 回调函数
     */
    function getWxConfig(callback) {
        ajax
            .get(
                URL_GET_WX_PARAM,
                {
                    url: encodeURIComponent(window.location.href)
                }
            )
            .then(function (data) {
                if (typeof callback === 'function') {
                    callback(data);
                }
            });
    }

    function initWXVoiceEvent(voiceDialog, opts) {
        opts = opts || {};

        function startRecordHandler(self) {
            dom.addClass(self.speakBtn, 'press');

            // TODO 需要判断当前是否是录音状态
            // 如果是的话直接停止上一次录音状态，开始新的录音

            wx.startRecord({
                cancel: function () {
                    alert('用户拒绝授权录音');
                }
            });
        }

        function stopRecordHandler(self) {
            dom.removeClass(self.speakBtn, 'press');

            wx.stopRecord({
                success: function (res) {
                    voiceLocalId = res.localId;

                    wx.translateVoice({
                        localId: voiceLocalId, // 需要识别的音频的本地Id，由录音相关接口获得
                        isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {

                            // TODO 需要转义
                            voiceDialog.setVoiceStatus('complete', res.translateResult, function (result) {
                                if (typeof opts.onsuccess === 'function') {
                                    opts.onsuccess(result);
                                }
                            });
                        }
                    });
                }
            });
        }

        voiceDialog.on('show', startRecordHandler);
        voiceDialog.on('complete', stopRecordHandler);
        voiceDialog.on('close', wx.stopRecord);

        // 超时处理
        wx.onVoiceRecordEnd({
            complete: function (res) {
                voiceLocalId = res.localId;
                alert('录音时间已超过一分钟');
            }
        });
    }

    function isSupportWebRTC() {
        if (navigator.getUserMedia && window.URL && window.AudioContext && window.Worker) {
            return true;
        }

        return false;
    }

    function isWechat() {
        return env.browser.wechat;
    }

    /**
     * 兼容性监测
     *
     * @inner
     * @return {boolean} 是否兼容语音
     */
    function checkCompat() {
        // 检测是否是微信
        if (isWechat()) {
            return true;
        }
        // 监测是否支持WebRTC
        if (isSupportWebRTC()) {
            return true;
        }

        return false;
    }

    /**
     * 初始化微信语音
     *
     * @public
     * @param {Object} voiceDialog 语音浮层实例
     * @param {Object} opts 参数
     * @param {string} opts.oncomplete 识别完成后回调函数
     */
    function initWxVoice(voiceDialog, opts) {
        opts = opts || {};

        getWxConfig(function (data) {
            // 设置微信参数
            wxConfig({
                debug: true,
                appId: data.appid,
                timestamp: data.timestamp,
                nonceStr: data.noncestr,
                signature: data.signature
            });

            // 初始化微信语音
            wx.ready(function () {
                initWXVoiceEvent(
                    voiceDialog,
                    {
                        onsuccess: function (translateResult) {
                            if (typeof opts.oncomplete === 'function') {
                                opts.oncomplete(translateResult);
                            }
                        }
                    }
                );
                voiceDialog.show();
            });
        });
    }

    function initWebRTC() {
        navigator.getUserMedia(
            {audio: true},
            function (s) {
                console.log(1);
                userMedia = s;
            },
            function (e) {
                alert(e);
            }
        );
    }

    /**
     * 初始化
     *
     * @public
     * @param {Object} opts 参数
     * @param {string|HTMLElement=} opts.trigger 触发参数
     * @param {string} opts.oncomplete 完成后回调函数
     */
    exports.init = function (opts) {
        opts = opts || {};
        var trigger = opts.trigger;

        var triggerElem = dom.query(trigger);
        var isInited = false;
        var voiceDialog;

        Tap.mixin(triggerElem);

        triggerElem.addEventListener('click', function () {

            if (!checkCompat()) {
                alert('您的浏览器暂不支持语音哦~');
                return;
            }

            if (!isInited) {
                voiceDialog = new VoiceDialog();

                // 初始化微信
                if (isWechat()) {
                    initWxVoice(voiceDialog, {
                        oncomplete: opts.oncomplete
                    });
                }

                // 初始化原生
                if (isSupportWebRTC()) {
                    initWebRTC(voiceDialog, {
                        oncomplete: opts.oncomplete
                    });
                }

                isInited = true;
                return;
            }

            voiceDialog.show();
        });
    };

    exports.dispose = function () {

    };

    return exports;
});
