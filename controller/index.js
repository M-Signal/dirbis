var pembeli=require('./pembeli');
var penjual=require('./penjual');
var admin=require('./admin');
var controller ={
    pembeli:pembeli,
    penjual:penjual,
    admin:admin
}


module.exports=controller;
