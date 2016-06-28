<?php
require_once "voice.php";
// 陈功
$voice = new VOICE("mFwFjUT2ze73v0mTnp0fvsjh", "82efa56176fe206a84cfc07024246577");

$accessToken = $voice->GetAccessToken($url);

$jsonResponse = array(
  "status" => 0,
  "msg" => "",
  "data" => $accessToken,
);

echo json_encode($jsonResponse);

