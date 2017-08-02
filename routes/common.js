
var model=require('.././model/model');
// common functions
var requestify = require('requestify'); 
var knex = require('knex')({
   client: 'pg',
    connection: {
      port:8989,
      database:'direktoribisnis',
      user:'postgres',
      password:'postgres',
      host:'127.0.0.1'
    }
});
var localStorage=require('localStorage');


exports.check_login_penjual = function(req, res, next){
    // if not protecting we check for public pages and don't check_login
	if(req.session.needs_setup == true){
        next();
        return;
    }
	if(req.session.user||req.session.passport){
        if(req.session.user){
            var username=req.session.users_name;
             model.penjual.where('username',username)
             .count().then(function (count) {
                if(count>0){
                    knex('user_account').select('confirmation')
                    .where('username','=',username).then(function (user) {  
                        user=JSON.stringify(user);
                        user=JSON.parse(user);
                        if(user[0].confirmation){
                            next();
                            return;
                        }
                        else{
                            res.send(401);
                        }
                    });
                    
                }
                else{
                    res.send(401);
                }
            }).catch(function (err) {  
                console.log(err)
            });
            return;
        }else if(req.session.passport){
            requestify.get('http://127.0.0.1:5000/me/facebook').then(function(response) {
                var resp = response.getBody();
                var username=resp.username;
                model.penjual.where('username',username).fetch().then(function (usr) {  
                    if(!usr==null){
                        next();
                        return;
                    }else{
                        res.send(401);
                    }
                }).catch(function (err) {  
                    console.log(err)
                });
            });
        }
	}else{
		res.redirect('/login');
	}
};
exports.check_login_pembeli = function(req, res, next){
    if(req.session.user||req.session.passport){
        if(req.session.user){
            knex('users')
            .join('user_account', 'users.username', '=', 'user_account.username')
            .join('pembeli', 'users.username', '=', 'pembeli.username')
            .select('users.username','users.id','user_account.confirmation')
            .where('users.username','=',req.session.users_name).andWhere('confirmation','=',true)
            .then(function (user) { 
                user=JSON.stringify(user);
                user=JSON.parse(user);
                if(user[0]){
                        next();
                        return;
                    }else{
                        res.send(401);
                    }
            }).catch(function (err) {  
                console.log(err)
            });
            
            return;
        }else if(req.session.passport){
            requestify.get('http://127.0.0.1:5000/me/facebook').then(function(response) {
                var resp = response.getBody();
                var username=resp.username;
                model.pembeli.where('username',username).fetch().then(function (usr) {  
                    if(!usr==null){
                        next();
                        return;
                    }else{
                        res.send(401);
                    }
                }).catch(function (err) {  
                    console.log(err)
                });
            });
        }
	}else{
		res.redirect('/login');
	}
};
exports.check_login_admin = function(req, res, next){
    if(req.session.users_name){
        model.admin_account.where('username',req.session.users_name).count().then(function(count){
            if(count>0){
                next();
                return;
            }
            else{
                res.redirect('/protected/login');
            }
        });
    }
    else{
            res.redirect('/protected/login');
    }
};
exports.check_login_profile = function(req, res, next){
	if(req.session.is_penjual){
        res.redirect('/penjual');
    }
    else{
        res.redirect('/pembeli/panel');
    }
};
exports.add_products = function(req, res, cb){
    var async = require('async');
    var hostname = req.config.get('application').base_url;
    req.db.products.find({product_published:'true'}).exec(function (err, products) {
        var posts = [];
        async.eachSeries(products, function iteratee(item, callback) {
            var post = {};
            var url = item._id;
            if(item.product_permalink){
                url = item.product_permalink;
            }
            post.url = hostname + "/" + url;
            post.changefreq = 'weekly';
            post.priority = 0.7;
            posts.push(post);
            callback(null, posts);
        }, function done() {
            cb(null, posts);
        });
    });
}
exports.restrict_penjual = function(req, res, next){
	exports.check_login_penjual(req, res, next);
};
exports.restrict_pembeli = function(req, res, next){
	exports.check_login_pembeli(req, res, next);
};
exports.restrict_admin = function(req, res, next){
	exports.check_login_admin(req, res, next);
};

exports.restrict_profile = function(req, res, next){
	exports.check_login_profile(req, res, next);
};

exports.clear_session_value = function(session, session_var){
	var temp = session[session_var];
	session[session_var] = null;
	return temp;
};
exports.update_total_cart_amount = function(req, res){
    var async = require('async');
    var config = req.config.get('application');
    
    req.session.total_cart_amount = 0;
    async.each(req.session.cart, function(cart_product, callback) {
        req.session.total_cart_amount = req.session.total_cart_amount + cart_product.total_item_price;
        callback();
    });
    
    // under the free shipping threshold
    if(req.session.total_cart_amount < config.free_shipping_amount){
        req.session.total_cart_amount = req.session.total_cart_amount + config.flat_shipping;
        req.session.shipping_cost_applied = true;
    }else{
        req.session.shipping_cost_applied = false;
    }
};

exports.check_directory_sync = function (directory) {  
    var fs = require('fs');
    try {
        fs.statSync(directory);
    } catch(e) {
        fs.mkdirSync(directory);
    }
}
exports.get_images = function (dir, req, res, callback){
    var glob = require("glob");
	var fs = require("fs");

    model.products.where({id: dir}).fetch().then(function (product) {
        // loop files in /public/uploads/
        glob("public/uploads/" + dir +"/**", {nosort: true}, function (er, files) {
            // sort array
            files.sort();
            // declare the array of objects
            var file_list = new Array();
            // loop these files
            for (var i = 0; i < files.length; i++) {
                // only want files
                if(fs.lstatSync(files[i]).isDirectory() == false){
                    
                    // declare the file object and set its values
                    var file = {
                        id: i,
                        path: files[i].substring(6)
                    };
                    if(product.product_image == files[i].substring(6)){
                        file.product_image = true;
                    }
                    // push the file object into the array
                    file_list.push(file);
                }
            }
            callback(file_list); 
        });
    });
}
exports.order_with_paypal = function(req, res){
    var config = req.config.get('application');
    var paypal = require('paypal-express-checkout').init(config.paypal_username, config.paypal_password, config.paypal_signature, config.base_url + '/checkout_return', config.base_url + '/checkout_cancel', true);
        
    // place the order with PayPal
    paypal.pay(req.session.order_id, req.session.total_cart_amount, config.paypal_cart_description, config.paypal_currency, true, function(err, url) {
        if (err) {
            console.error(err);
            // We have an error so we show the checkout with a message
            res.render('checkout', { 
                title: "Checkout", 
                config: req.config.get('application'),
                session: req.session,
                payment_approved: "false",
                payment_message: err,
                message: exports.clear_session_value(req.session, "message"),
                message_type: exports.clear_session_value(req.session, "message_type"),
                helpers: req.handlebars.helpers,
                show_footer: "show_footer"
            });
            return;
        }

        // redirect to paypal webpage
        res.redirect(url);
    });
};
exports.generateId=function(){
    return Math.floor(parseInt(Date.now())/1000)+getRandom(1000,5000)
}



function getRandom(max,min){
    min=Math.ceil(min);
    max=Math.floor(max);
    return Math.floor(Math.random()*(max-min))+min;
}

function manageUrl(req,res){
 if(!localStorage.getItem('url')){
        localStorage.setItem('url',req.url)
        return;
    }
}