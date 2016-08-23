# mvoice

<img src="https://raw.githubusercontent.com/baiduTrust/mvoice/master/tmp/screenshot_1.png" width="300">

## 简介

移动端语音组件（支持使用微信和原生两种方式）

- 在微信客户端使用微信 JSSDK 的语音 api 实现
- 对于正常浏览器（目前只有安卓的原生 Chrome 完全支持）使用 html5 原生方式

## 使用方法

```javascript

var mvoice = require('mvoice');

// 创建并渲染组件
var mvoiceDialog = mvoice.render({
    // 如果设置了input，则输入完成后将内容追加到input的value中
    input: '#search-input',
    // 语音输入完成后的回调
    oncomplete: function (result) {
        console.log(result);
    }
});

// 销毁组件
mvoiceDialog.dispose();
```

## 线上demo

<https://koubei.baidu.com/m2/search>

## 本地调试

安装edp和edpx-mobile

> npm install -g edp edpx-mobile

启动服务，开始调试

> edpm start 启动你的项目

## 注意事项

微信语音需要注意：
- 需要将 `mock/getweixinconfigajax.php` 中的 appID 和 appsecret 替换成自己的，方便自己调试，申请测试账号：[点此](http://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)
- 需要关注该测试号才可以使用 JSSDK
- 注意需要设置 js 安全域名（如果有端口，需要将端口加上，如`baidu.com:8848`）

原生语音需要注意：
- Chrome 在版本48以后需要支持 https 才可以使用原生的语音 api，所以只能在https网站或者 localhost 下模拟，可以考虑使用较老版本的 Chrome 去测试
- 因为语音只支持微信和 Android 的 Chrome ，所以如果用pc模拟设备的话请模拟安卓机


