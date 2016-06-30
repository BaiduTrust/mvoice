<?php
require_once "jssdk.php";
$url = $_GET["url"];
// 陈功
$jssdk = new JSSDK("wxdd3d4b379560c4b8", "8ce0e00808610c59705f9bed68d57f67");

$signPackage = $jssdk->GetSignPackage($url);

$jsonResponse = array(
    "status" => 0,
    "msg" => "",
    "data" => $signPackage,
);

echo json_encode($jsonResponse);

