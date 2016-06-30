define(function (require) {
    var dom = require('saber-dom');
    var lan = require('saber-lang');
    var Resolver = require('saber-promise');
    var ajax = require('saber-ajax');
    var Emitter = require('saber-emitter');

    var isHttps = location.protocol === 'https:';

    var WORKER_PATH = '/dep/baiduvoice/recorderWorker.js';

    var URL_BAIDU_VOICE = isHttps
        ? 'https://sp3.baidu.com/6qUDsjip0QIZ8tyhnq/echo.fcgi'
        : 'http://vse.baidu.com/echo.fcgi';

    var userMedia;

    var context = null;
    var Recorder = function (userMedia, cfg) {
        Emitter.mixin(this);
        var self = this;
        context = context || new AudioContext();

        var source = context.createMediaStreamSource(userMedia);
        var config = lan.extend({
            timeout: 5000
        }, cfg);

        var bufferLen = config.bufferLen || 4096;
        this.context = source.context;
        // this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
        var inputChannels = 1;
        var outputChannels = 1;
        this.node = this.context.createScriptProcessor(bufferLen, inputChannels, outputChannels);
        var worker = new Worker(config.workerPath || WORKER_PATH);
        worker.postMessage({
            command: 'init',
            config: {
                uid: 'user' + parseInt(Math.random() * 100000),
                outputChannels: outputChannels,
                outputSampleRate: 8000,
                sampleRate: this.context.sampleRate
            }
        });

        var messageCallbacks = {};
        function postToWorker(object, callback) {
            var eventId = parseInt(Math.random() * 100000) + '_' + new Date().getTime();
            if (object) {
                object.eventId = eventId;
            }

            worker.postMessage(object);
            if (callback) {
                messageCallbacks[eventId] = callback;
            }
        }
        worker.onmessage = function (e) {
            if (e.data && e.data.eventId && typeof messageCallbacks[e.data.eventId] === 'function') {
                messageCallbacks[e.data.eventId](e.data.data);
                messageCallbacks[e.data.eventId] = null;
            }

        };

        var recording = false;

        this.node.onaudioprocess = function (e) {
            if (!recording) {
                return;
            }

            var buffer = [];
            var i;
            for (i = 0; i < outputChannels; i++) {
                buffer.push(e.inputBuffer.getChannelData(i));
            }
            postToWorker({
                command: 'record',
                buffer: buffer
            });
        };

        this.configure = function (cfg) {
            for (var prop in cfg) {
                if (cfg.hasOwnProperty(prop)) {
                    config[prop] = cfg[prop];
                }

            }
        };
        this.reinit = function () {
            worker.postMessage({
                command: 'reinit'
            });
        };

        this.start = function () {
            if (recording) {
                return;
            }

            self.emit('start');
            // callbacks.start.fire();
            startSend(this);
            recording = true;
        };

        // var callbacks={};
        // var recorder=this;
        // ['stop','start','finish','stop','result'].forEach(function(ev, i){
        //     callbacks[ev]=$.Callbacks();
        //     recorder["on"+ev]=function(func){
        //         callbacks[ev].add(func);
        //     };
        // });
        this.stop = function (notSendLastPack) {
            if (recording) {
                if (notSendLastPack) {
                    // callbacks.finish.fire();
                    self.emit('finish');
                }
                else {
                    startSend(this, true);
                }

                // callbacks.stop.fire();
                self.emit('stop');
                if (stopTimeout) {
                    clearTimeout(stopTimeout);
                }
            }

            recording = false;
        };

        this.clear = function () {
            postToWorker({
                command: 'clear'
            }, cb);
        };

        this.getBuffer = function (cb) {
            postToWorker({
                command: 'getBuffer'
            }, cb);
        };
        this.getSendBuffer = function (cb, isLast) {
            var command = isLast ? 'getLastSendBuffer' : 'getSendBuffer';
            postToWorker({
                command: command
            }, cb);
        };

        this.exportWAV = function (cb, type) {
            postToWorker({
                command: 'exportWAV',
                type: type
            }, cb);
        };

        source.connect(this.node);
        this.node.connect(this.context.destination); // this should not be necessary
        var curAjax = [];
        var stopTimeout;
        var lastResult;
        function startSend(recorder, isLast) {

            /*
            stopTimeout=setTimeout(function(){
                recorder.stop(true);
            },config.timeout);
            */
            recorder.getSendBuffer(function (data) {
                if (!data) {
                    if (!isLast) {
                        setTimeout(function () {
                            startSend(recorder);
                        }, 200);
                    }

                    return;
                }

                // console.debug(data.json);

                // var ajaxComp=$.ajax({
                //     url:"http://vse.baidu.com/echo.fcgi",
                //     cache:false,
                //     contentType:"Content-Type: multipart/form-data; boundary="+data.boundary,
                //     dataType:"json",
                //     data:data.buffer,
                //     processData:false,
                //     type:'post'
                // });
                var ajaxComp = ajax.request(URL_BAIDU_VOICE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data; boundary=' + data.boundary,
                        'Accept': 'application/json, text/javascript, */*; q=0.01'
                    },
                    stringify: false,
                    data: data.buffer
                });

                curAjax.push(ajaxComp);

                ajaxComp.ensure(function (result) {
                    result = JSON.parse(result);
                    if ((result && result.result && (result.result.res_type === 3 || result.result.res_type === 5)) // 后端告诉我此session已经识别完毕
                        || !result.result || (result && result.result && result.result.err_no) // 后端出错
                    ) {
                        recorder.stop(true);
                        curAjax.forEach(function (ajax, i) {
                            ajax.abort();
                        });
                        curAjax = [];
                    }

                    // console.log(recording);
                    // console.log(isLast);
                    if (recording && !isLast) {
                        startSend(recorder);
                    }

                    if (result && result.content && result.content.item) {
                        // callbacks.result.fire(result);
                        self.emit('result', result);
                    }

                    if (isLast) {
                        // callbacks.finish.fire(result);
                        self.emit('finish', result);
                    }

                });
            }, isLast);
        }
    };

    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia;

    Recorder.support = function () {
        // 基本上，只支持新版的chrome和ff
        if (!navigator.getUserMedia || !window.URL) {
            return false;
        }

        if (!window.AudioContext) {
            return false;
        }

        if (!window.Worker) {
            return false;
        }

        return true;
    };

    Recorder.init = function (cfg) {
        var resolver = new Resolver();

        if (userMedia) {
            resolver.fulfill(new Recorder(userMedia, cfg));
        }
        else {
            navigator.getUserMedia({
                audio: true
            }, function (s) {
                // console.log(1);
                userMedia = s;
                resolver.fulfill(new Recorder(userMedia, cfg));
            }, function (e) {
                // console.log(e);
                resolver.reject(e);
            });
        }
        return resolver.promise();
    };

    return Recorder;
});
