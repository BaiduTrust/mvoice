# mvoice

## 本地调试

安装edp和edpx-mobile

> npm install -g edp edpx-mobile

启动服务，开始调试

> edpm start 启动你的项目

## 注意事项

原生语音需要注意：
- Chrome在版本48以后需要支持https才可以使用原生的语音api，所以只能在https网站或者localhost下模拟，可以考虑使用较老版本的Chrome去测试
- 因为语音只支持微信和Android的Chrome，所以如果用pc模拟设备的话请模拟安卓机

微信语音需要注意
- 需要将 `mock/getweixinconfigajax.php` 中的appID和appsecret替换成自己的，方便自己调试，申请测试账号：[点此](http://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)
- 需要关注该测试号才可以使用JSSDK
- 注意需要设置js安全域名（如果有端口，需要将端口加上，如`baidu.com:8848`）
