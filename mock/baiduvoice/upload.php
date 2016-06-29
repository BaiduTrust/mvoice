<?php
$token = $_GET["token"];
// post
function send_post($url, $post_data) {
    $postData = http_build_query($post_data);
    $options = array(
        'http' => array(
            'method' => 'POST',
            'header' => 'Content-type:application/x-www-form-urlencoded',
            'content' => $postData,
            'timeout' => 15 * 60,
        ),
  );

  $context = stream_context_create($options);
  $result = file_get_contents($url, false, $context);

  return $result;
}


// file

$res = '';
$stream = file_get_contents('php://input');
// 用户唯一标识，用来区分用户，填写机器 MAC 地址或 IMEI 码，长度为60以内
$cuid = 1212312312121231231123;

if (!empty($stream)) {
    // 写入临时文件
    $tmpname = tempnam('/tmp','yuyin');
    $fb = @fopen($tmpname, 'w');
    fwrite($fb, $stream);
    fclose($fb);

    // 文件数据
    $size = filesize($tmpname);
    $base64 = base64_encode(file_get_contents($tmpname));
    unlink($tmpname);

    // post
    $param = array(
        format => 'wav',
        rate => 16000,
        channel => 1,
        cuid => $cuid,
        token => $token,
        speech => $base64,
        len => $size,
    );
    echo $param;
    $res = send_post('http://vop.baidu.com/server_api', $param);
}

echo $res;
