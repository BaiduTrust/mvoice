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
    var baiduvoice = require('baiduvoice');
    var VoiceDialog = require('./VoiceDialog');

    /**
     * 获取微信配置参数的url
     *
     * @const
     * @type {string}
     */
    var URL_GET_WX_PARAM = '/mock/weixin/getweixinconfigajax.php';

    var exports = {};

    // 微信语音本地id
    var voiceLocalId;

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

    /**
     * 初始化微信
     *
     * @inner
     * @param {Object} voiceDialog 语音组件
     * @param {Object} opts 参数对象
     * @param {Function} opts.onsuccess 成功后回调
     */
    function initWXVoiceEvent(voiceDialog, opts) {
        opts = opts || {};

        function startRecordHandler(self) {
            // TODO 需要判断当前是否是录音状态
            // 如果是的话直接停止上一次录音状态，开始新的录音

            wx.startRecord({
                cancel: function () {
                    alert('用户拒绝授权录音');
                }
            });
        }

        function stopRecordHandler(self) {
            wx.stopRecord({
                success: function (res) {
                    voiceLocalId = res.localId;

                    wx.translateVoice({
                        // 需要识别的音频的本地Id，由录音相关接口获得
                        localId: voiceLocalId,
                        // 默认为1，显示进度提示
                        isShowProgressTips: 1,
                        success: function (res) {

                            // 如果识别的内容为空，则直接关闭
                            if (!res.translateResult) {
                                voiceDialog.setVoiceStatus('complete', '暂未识别');
                                return;
                            }

                            // 识别成功
                            voiceDialog.setVoiceStatus('complete', res.translateResult, function (result) {
                                // 执行成功后回调
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

    /**
     * 是否支持原生语音
     *
     * @inner
     * @return {boolean} 是否支持原生语音
     */
    function isSupportAudio() {
        if (baiduvoice.support()) {
            return true;
        }

        return false;
    }

    /**
     * 是否是微信
     *
     * @inner
     * @return {boolean} 是否是微信
     */
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
        if (isSupportAudio()) {
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

    /**
     * 初始化百度语音
     *
     * @public
     * @param {Object} voiceDialog 语音浮层实例
     * @param {Object} opts 参数
     * @param {string} opts.oncomplete 识别完成后回调函数
     */
    function initBaiduVoice(voiceDialog, opts) {
        opts = opts || {};

        baiduvoice.init().then(
            function (recorder) {

                recorder.on('result', function (result) {
                    console.log('result');
                    console.log(result);
                    var resultTxt = result.content.item.join(', ');

                    // 最后一个reuslt的idx为-1，用这个结果去判断
                    if (result.result.idx === -1) {
                        voiceDialog.setVoiceStatus(
                            'complete',
                            resultTxt,
                            function (txt) {
                                if (typeof opts.oncomplete === 'function') {
                                    opts.oncomplete(txt);
                                }
                            }
                        );
                    }
                    // 正在说话中，不断返回识别的结果
                    else {
                        voiceDialog.setVoiceStatus('result', resultTxt);
                    }
                });

                recorder.on('finish', function (result) {
                    voiceDialog.setVoiceStatus('finish');
                });

                // 先解绑
                voiceDialog.off('show');
                voiceDialog.off('complete');
                voiceDialog.off('close');

                voiceDialog.on('show', function () {
                    recorder.start();
                });
                voiceDialog.on('complete', function () {
                    recorder.stop();
                });
                voiceDialog.on('close', function () {
                    recorder.stop();
                });

                voiceDialog.show();

            },
            function () {
                alert('无法获取麦克风~');
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

            // 处理微信
            if (isWechat()) {
                if (!isInited) {
                    voiceDialog = new VoiceDialog();
                    initWxVoice(voiceDialog, {
                        oncomplete: opts.oncomplete
                    });

                    isInited = true;
                }
                else {
                    voiceDialog.show();
                }

                return {
                    dispose: voiceDialog.dispose
                };
            }

            // 处理h5
            if (isSupportAudio()) {
                if (!isInited) {
                    voiceDialog = new VoiceDialog();
                    isInited = true;
                }

                initBaiduVoice(voiceDialog, {
                    oncomplete: opts.oncomplete
                });

                return {
                    dispose: voiceDialog.dispose
                };
            }
        });
    };

    return exports;
});
