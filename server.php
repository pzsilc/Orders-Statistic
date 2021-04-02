<?php

if($_SERVER['REQUEST_METHOD'] != 'POST'){
    return;
}

$arr = $_POST['ids'];
$res = [];
mssql_connect('', '', '');
mssql_select_db('');


foreach($arr as $i){
    $r = mssql_query("SELECT createdDate FROM HM.ZO WHERE opis='e $i' OR opis='a $i'");
    if(mssql_num_rows($r) > 0){
        $date = mssql_fetch_assoc($r)['createdDate'];
        array_push($res, strtotime($date)/1000);
    } else {
        array_push($res, "");
    }
}

echo json_encode($res);

?>