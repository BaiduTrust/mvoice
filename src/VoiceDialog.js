/**
 * @file movice
 * @author cgzero[cgzero@cgzero.com]
 * @data 2016-05-30
 */

define(function (require) {

    var dom = require('saber-dom');
    var Emitter = require('saber-emitter');

    /**
     * 语音输入中时的文案
     *
     * @const
     * @type {string}
     */
    var SPEAKING_TXT = '正在聆听中...';

    /**
     * 语音浮层
     *
     * @class
     * @constructor
     * @fires VoiceDialog#beforeshow
     * @fires VoiceDialog#show
     * @fires VoiceDialog#beforehide
     * @fires VoiceDialog#hide
     * @fires VoiceDialog#beforedispose
     * @fires VoiceDialog#dispose
     * @fires VoiceDialog#close
     * @fires VoiceDialog#complete
     * @param {Object} opts 语音浮层参数
     * @param {string} opts.defaultTxt 默认提示话术
     */
    function VoiceDialog(opts) {
        Emitter.mixin(this);

        opts = opts || {};

        this._initDom();
        this._initEvent();
    }

    VoiceDialog.prototype = {
        constructor: VoiceDialog,

        /**
         * 初始化dom
         *
         * @private
         */
        _initDom: function () {
            var main = this.main = document.createElement('div');
            main.className = 'voice-masker';
            main.innerHTML = ''
                + '<div class="wrapper">'
                +    '<a href="#" onclick="return false" class="voice-close-btn">×</a>'
                +    '<div class="voice-speak-btn">'
                +        '<div class="voice-speak-circle"></div>'
                +        '<div class="voice-speak-wave level1"></div>'
                +        '<div class="voice-speak-wave level2"></div>'
                +        '<div class="voice-speak-wave level3"></div>'
                +        '<span>完成</span>'
                +    '</div>'
                +    '<div class="voice-logo"></div>'
                +    '<div class="voice-text">'
                +    this.defaultTxt
                +    '</div>'
                + '</div>';

            dom.hide(main);
            // 挂载到DOM树
            document.body.appendChild(main);


            this.closeBtn = dom.query('.voice-close-btn', main);
            this.speakBtn = dom.query('.voice-speak-btn', main);
            this.voiceText = dom.query('.voice-text', main);
        },

        /**
         * 初始化事件
         *
         * @private
         * @fires VoiceDialog#close
         * @fires VoiceDialog#complete
         */
        _initEvent: function () {
            var self = this;

            // 点击关闭按钮
            // 因为存在点击穿透的问题，所以我们这里使用click
            self.closeBtn.addEventListener('touchend', function () {
                dom.removeClass(self.speakBtn, 'press');
                self.emit('close', self);
                setTimeout(function () {
                    self.hide();
                }, 350);

            });

            // 点击说话按钮
            self.speakBtn.addEventListener('touchstart', function () {
                dom.removeClass(self.speakBtn, 'press');
                self.emit('complete', self);
            });
        },

        /**
         * 设置文字区域的文字
         *
         * @private
         * @param {string} txt 文字内容
         */
        _setVoiceText: function (txt) {
            this.voiceText.innerHTML = txt;
        },

        /**
         * 设置文字区域状态
         *
         * @public
         * @param {string} status 状态
         * @param {string=} speakWord 用户输入的语音内容
         * @param {Function=} callback complete状态的回调函数
         */
        setVoiceStatus: function (status, speakWord, callback) {
            var self = this;

            switch (status) {
                // 开始说话
                case 'speaking':
                    dom.addClass(self.speakBtn, 'press');
                    self._setVoiceText(SPEAKING_TXT);
                    break;

                // 不断返回结果
                case 'result':
                    self._setVoiceText(speakWord);
                    break;

                // 产生结果，关闭语音浮层
                case 'complete':
                    dom.removeClass(self.speakBtn, 'press');
                    self._setVoiceText(speakWord);
                    setTimeout(
                        function () {
                            self.hide();

                            if (typeof callback === 'function') {
                                callback(speakWord);
                            }
                        },
                        500
                    );
                    break;

                // 关闭语音浮层
                case 'finish':
                    dom.removeClass(self.speakBtn, 'press');
                    setTimeout(
                        function () {
                            self.hide();

                            if (typeof callback === 'function') {
                                callback();
                            }
                        },
                        500
                    );
                    break;
            }
        },

        /**
         * 展示语音浮层
         *
         * @public
         * @fires VoiceDialog#beforeshow
         * @fires VoiceDialog#show
         */
        show: function () {
            var self = this;
            self.setVoiceStatus('speaking');
            self.emit('beforeshow', self);
            dom.show(self.main);
            self.emit('show', self);
        },

        /**
         * 隐藏语音浮层
         *
         * @public
         * @fires VoiceDialog#beforehide
         * @fires VoiceDialog#hide
         */
        hide: function () {
            this.emit('beforehide', this);
            dom.hide(this.main);
            this.emit('hide', this);
        },

        disable: function () {
            // TODO
        },

        enable: function () {
            // TODO
        },

        /**
         * 销毁语音浮层
         *
         * @public
         * @fires VoiceDialog#beforedispose
         * @fires VoiceDialog#dispose
         */
        dispose: function () {
            // 删除dom
            this.emit('beforedispose');
            document.body.removeChild(this.main);
            this.emit('dispose');
        }
    };

    return VoiceDialog;
});
