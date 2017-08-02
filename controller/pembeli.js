// var common = require('./common');
var model  = require('.././model/model');
var express = require('express');
var router = express.Router();
var common = require('.././routes/common');
var model  = require('.././model/model');
var  graph = require('fbgraph');
var localStorage = require('localStorage');
var Promise = require('bluebird');
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
function isEmpty(obj){
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}
function convertToDateJS(date){
    return date.substring(0, 10);
}
function isInArray(value,arr){
    return array.indexOf(value) > -1;
}

module.exports={
        index:function (req,res,next) {  
             model.products.where(true).fetchAll()
            .then(function (results) {
            results = JSON.stringify(results);
            results = JSON.parse(results);
            res.render('pages/home', { 
                title       : 'Shop',
                results     : results,
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                config      : req.config.get('application'),
                helpers     : req.handlebars.helpers,
                page_url    : req.config.get('application').base_url,
                show_footer : "show_footer"
            });
            }).catch(function(err){
                console.log(err);
            });

            var channel=req.channel;
            channel.publish('posting',{data:'123'});
        },
        productsPage:function (req,res) {  
            model.products.where('product_featured','on').fetchAll()
            .then(function (results) {
            results = JSON.stringify(results);
            results = JSON.parse(results);
            res.render('products_page', { 
                title       : 'Shop',
                results     : results,
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                config      : req.config.get('application'),    
                helpers     : req.handlebars.helpers,
                page_url    : req.config.get('application').base_url,
                show_footer : "show_footer"
            });
            }).catch(function(err){
                console.log(err);
            });
        },
        panel_pembeli:function (req,res,next) {  
                res.render('pembeli/panel', { 
                    title       : 'Panel',
                    session     : req.session,
                    message     : common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    config      : req.config.get('application'),
                    helpers     : req.handlebars.helpers,
                    page_url    : req.config.get('application').base_url,
                    show_footer : "show_footer"
                });
        },
        register:function (req,res) {  
            model.admin_account.where(true).count().then(function(count){
            if(count>0){
                if(req.method==='GET'){
                    res.render('register', { 
                        title       : 'Register',
                        session     : req.session,
                        message     : common.clear_session_value(req.session, "message"),
                        message_type: common.clear_session_value(req.session, "message_type"),
                        config      : req.config.get('application'),
                        helpers     : req.handlebars.helpers,
                        page_url    : req.config.get('application').base_url,
                        show_footer : "show_footer"
                    });
                }
                else if(req.method==='POST'){
                    var users={
                        id:common.generateId(),
                        username:req.body.username,
                        email:req.body.email  ,
                        fullname:req.body.fullname
                    };
                    var user_account={
                        id:common.generateId(),
                        username:req.body.username,
                        password:req.body.cpassword
                    };
                    var doc={
                        username:req.body.username,
                    };  
                        knex.transaction(function(trx) {
                        knex('users').transacting(trx).insert(users)
                            .then(function(resp) {
                            return knex('user_account')
                                .transacting(trx)
                                .insert(user_account);
                                
                            }).then(function (resp) {  
                            return knex('pembeli')
                                .transacting(trx)
                                .insert(doc)
                            })
                            .then(trx.commit)
                            .catch(trx.rollback);
                        })
                        .then(function(resp) {
                            console.log('Transaction complete.');
                            res.redirect('/login');
                        })
                        .catch(function(err) {
                            console.error(err);
                        });
                }
            }
            else{
                res.redirect('/setup');
            }
        });
        },
        informasiAkunPembeli:function (req,res) {  
            var username = req.session.users_name;
            knex('users')
            .join('user_account', 'users.username', '=', 'user_account.username')
            .join('pembeli', 'users.username', '=', 'pembeli.username')
            .select('*')
            .where('users.username','=',username)
            .then(function (user) { 
                user=JSON.stringify(user);
                user=JSON.parse(user);
                if(typeof user[0].birth!='undefined' &&  user[0].birth!=null){
                    user[0].birth=convertToDateJS(user[0].birth);
                }
                res.render('pembeli/informasi_akun', { 
                    title       : 'Akun',
                    user        : user[0],
                    session     : req.session,
                    message     : common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    config      : req.config.get('application'),
                    helpers     : req.handlebars.helpers,
                    page_url    : req.config.get('application').base_url,
                    show_footer : "show_footer"
                });

            }).catch(function (err) {  
                console.log(err);
            });
          
        },
        editAccount:function (req,res) {  
            var body=req.body;
            var gender;
            var user={
                username:body.username,
                email:body.email,
                fullname:body.fullname
            };
            if(body.gender==='male'){
                gender=true
            }else{
                gender=false;
            }
            var pembeli={
                username:body.username,
                gender:gender,
                address:body.address,
                birth:body.birth,
                phone:body.phone
            }
            model.users.where('username',req.session.users_name)
            .fetch()
            .then(function(u){
                u=JSON.stringify(u);
                u=JSON.parse(u);
                knex.transaction(function(trx) {
                    knex('users').transacting(trx).where('id','=',u.id).update(user)
                        .then(function(resp) {
                        return knex('pembeli')
                            .transacting(trx)
                            .update(pembeli);
                        })
                        .then(trx.commit)
                        .catch(trx.rollback);
                    })
                    .then(function(resp) {
                        console.log('Transaction edit complete.');
                        req.session.users_name=pembeli.username;
                        res.redirect('/pembeli/akun/informasi');
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
                });
        },
        searchProductById:function (req,res) {  
            var classy     = require("markdown-it-classy");
            var markdownit = req.markdownit;
            markdownit.use(classy);
            model.products.query(function(q){
                q.where('id',req.params.id).orWhere('product_permalink',req.params.id)
            }).fetch().then(function(result){
                result = JSON.stringify(result);
                result = JSON.parse(result);
                    if(result == null || result==''|| result.product_published == "false"){
                        res.render('error', { message: '404 - Page not found' });
                    }
                    else{	
                        // show the view
                        common.get_images(result.id, req, res, function (images){
                            images=JSON.stringify(images);
                            images=JSON.parse(images);
                            res.render('product', { 
                                title              : result.product_title,
                                result             : result,
                                images             : images,
                                product_description: markdownit.render(result.product_description),
                                config             : req.config.get('application'),
                                session            : req.session,
                                page_url           : req.config.get('application').base_url + req.originalUrl,
                                message            : common.clear_session_value(req.session, "message"),
                                message_type       : common.clear_session_value(req.session, "message_type"),
                                helpers            : req.handlebars.helpers,
                                show_footer        : "show_footer"
                            });
                        });
                    }
            });
        },
        logout:function (req,res) {  
            req.session.user         = null;
            req.session.message      = null;
            req.session.message_type = null;
            req.session.passport     = null;
            req.session.user_type    = null;
            req.session.photo        = null;
             localStorage.setItem('url','');
            res.redirect('/');
        },
        search:function (req,res) {  
            var search_term    = req.body.frm_search;
            var category=req.body.searchCategory
            if(category==='PRODUK'){
                 // we search on the lunr indexes
                model.products.query(function(q){
                    q.where('product_title','Like','%'+search_term+'%')
                }).fetchAll().then(function(results){
                    results = JSON.stringify(results);
                    results = JSON.parse(results);
                    res.render('products_page', { 
                            title       : 'Results',
                            "results"   : results,
                            filtered    : true,
                            session     : req.session,
                            search_term : search_term,
                            message     : common.clear_session_value(req.session, "message"),
                            message_type: common.clear_session_value(req.session, "message_type"),
                            config      : req.config.get('application'),
                            helpers     : req.handlebars.helpers,
                            show_footer : "show_footer"
                        });
                });
            }else{
                 model.penjual.query(function(q){
                    q.where('company_name','Like','%'+search_term+'%')
                }).fetchAll().then(function(results){
                    results = JSON.stringify(results);
                    results = JSON.parse(results);
                     res.render('pages/company', { 
                        title       : 'company',
                        results     : results,
                        session     : req.session,
                        message     : common.clear_session_value(req.session, "message"),
                        message_type: common.clear_session_value(req.session, "message_type"),
                        config      : req.config.get('application'),    
                        helpers     : req.handlebars.helpers,
                        page_url    : req.config.get('application').base_url,
                        show_footer : "show_footer"
                    });
                });
            }

           
        },
        products:function (req,res) {  

            model.products.where(true).orderBy('product_added_date',"DESC").fetchAll().then(function(products){
            products = JSON.stringify(products);
            products = JSON.parse(products);
            res.render('products', { 
                title       : 'Products',
                config      : req.config.get('application'),
                products    : products,
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers     : req.handlebars.helpers
            });
            }).catch(function(err){
                console.log(err);
            });
        },
        cart:function (req,res,next) {  
            res.render('cart', { 
                title       : 'Cart',
                config      : req.config.get('application'),
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers     : req.handlebars.helpers,
                show_footer : "show_footer"
            });
        },
        checkout:function (req,res,next) {  
            // if there is no items in the cart then render a failure
            if(!req.session.cart){
                req.session.message      = "The are no items in your cart. Please add some items before checking out";
                req.session.message_type = "danger";
                res.redirect("/cart");
                return;
            }
            // render the checkout
            res.render('checkout', { 
                title       : 'Checkout',
                config      : req.config.get('application'),
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers     : req.handlebars.helpers,
                show_footer : "show_footer"
            });
        },
        getProductsByTag:function (req,res) {  
            model.products.where('id',req.params.tag).orderBy('product_added_date','DESC').fetchAll().then(function (results) {
                results=JSON.stringify(results);
                results=JSON.parse(results);
                res.render('products', { 
                    title       : 'Products',
                    filtered    : true,
                    config      : req.config.get('application'),
                    "results"   : results,
                    session     : req.session,
                    message     : common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    search_term : req.params.tag,
                    helpers     : req.handlebars.helpers
                });
            }).catch(function (err) {  
                console.log(err);
            });
        },
        login:function (req,res) { 
            model.admin_account.count('username').then(function (user_count) {  
                user_count=JSON.stringify(user_count);
                user_count=JSON.parse(user_count);
                user_count=parseInt(user_count);
                // we check for a user. If one exists, redirect to login form otherwise setup
                if(user_count > 0){			
                    // set needs_setup to false as a user exists
                    req.session.needs_setup = false;
                    res.render('login', { 
                        title        : 'Login',
                        referring_url: req.header('Referer'),
                        config       : req.config.get('application'),
                        message      : common.clear_session_value(req.session, "message"),
                        message_type : common.clear_session_value(req.session, "message_type"),
                        helpers      : req.handlebars.helpers,
                        show_footer  : "show_footer"
                    });
                }else{
                    // if there are no users set the "needs_setup" session
                    req.session.needs_setup = true;
                    res.redirect('/setup');
                }
            }).catch(function (err) {  
                console.log(err);
            });


        },
        setup:function (req,res) { 
            model.admin_account.where(true).count().then(function(count){
                if(count==0){
                    req.session.needs_setup = true;
                    res.render('setup', { 
                        title       : 'Setup',
                        config      : req.config.get('application'),
                        helpers     : req.handlebars.helpers,
                        message     : common.clear_session_value(req.session, "message"),
                        message_type: common.clear_session_value(req.session, "message_type"),
                        show_footer : "show_footer"
                    });
                }
            })
        },
        login_action:function (req,res,next) {  
            knex('users')
            .join('user_account', 'users.username', '=', 'user_account.username')
            .join('penjual', 'users.username', '=', 'penjual.username')
            .select('users.username','users.id','user_account.password','penjual.username','penjual.photo')
            .where('users.email','=',req.body.email)
            .then(function (user) { 
                user=JSON.stringify(user);
                user=JSON.parse(user);
                 if(isEmpty(user) || typeof user === undefined || user === null){
                     knex('users')
                    .join('user_account', 'users.username', '=', 'user_account.username')
                    .join('pembeli', 'users.username', '=', 'pembeli.username')
                    .select('users.username','users.id','user_account.password','pembeli.username','pembeli.photo')
                    .where('users.email','=',req.body.email)
                    .then(function (user) { 
                         if(isEmpty(user) || typeof user === undefined || user === null){
                            req.session.message      = "A user with that email does not exist.";
                            req.session.message_type = "danger";
                            req.session.save();
                            res.redirect('/login');
                            return;
                         }else{
                            if(req.body.password===user[0].password){
                                req.session.user       = req.body.email;
                                req.session.users_name = user[0].username;
                                req.session.user_id    = user[0].id;
                                req.session.user_type = 'pembeli';
                                req.session.photo      = user[0].photo;
                                res.redirect("/pembeli/panel");
                                return;
                            }
                            else{
                                req.session.message      = "Email or password does not exist.";
                                req.session.message_type = "danger";
                                req.session.save();
                                res.redirect('/login');
                                return;
                            }
                         }
                    }).catch(function (err) {  
                        console.log(err);
                    }); 
                }
                else{
                    if(req.body.password===user[0].password){
                        console.log(user[0].photo);
                        req.session.user       = req.body.email;
                        req.session.users_name = user[0].username;
                        req.session.user_id    = user[0].id;
                        req.session.user_type = 'penjual';
                        req.session.photo      = user[0].photo;
                        res.redirect("/penjual");
                        return;
                    }
                     else{
                        req.session.message      = "Email or password does not exist.";
                        req.session.message_type = "danger";
                        req.session.save();
                        res.redirect('/login');
                        return;
                    }
                }
            }).catch(function (err) {  
                console.log(err);
            });
          
        },
        auth:function (req,res,next) {  
            var provider = "";
            if (!isEmpty(req.session.passport))
                provider = req.session.passport.user.provider;
            if (provider === 'facebook') {
                graph.setAccessToken(localStorage.getItem('facebook_access_token'));
                graph.setVersion("2.2");
                var params = { fields: "name,gender,email" };
                graph.get("me", params, function (err, user) {
                    model.facebook_account.where({ facebook_id: user.id }).fetch().then(function (usr) {
                        usr=JSON.stringify(usr);
                        usr=JSON.parse(usr);
                        if (usr === null) {
                            localStorage.setItem('facebook_id', user.id);
                            if(user.email){
                               req.session.email=user.email;
                               req.session.message      = "isi kembali username anda";
                               req.session.message_type = "success";
                            }else{
                               req.session.email='';
                               req.session.message      = "isi kembali email dan username anda";
                               req.session.message_type = "success";
                            }
                            res.render('completing_account', { 
                                    title       : 'Completing Account',
                                    user        : user,
                                    config      : req.config.get('application'),
                                    session     : req.session,
                                    message     : common.clear_session_value(req.session, "message"),
                                    message_type: common.clear_session_value(req.session, "message_type"),
                                    helpers     : req.handlebars.helpers,
                                    show_footer : "show_footer"
                            });
                        }
                        else {
                            res.redirect('/');
                        }
                    }).catch(function (err) {
                        console.log(err);
                    });
                });
            }
            else if (provider === 'google') {
                res.send(req.session.passport.user);
            }
            else
                res.redirect('/login');
            
        },
        registerByFb:function (req,res,next){
            var doc={
                username:req.body.username,
                email:req.session.email
            };
            new model.users(doc).save(null,{method:'insert'}).then(function (usr) {  
                usr=JSON.stringify(usr);
                usr=JSON.parse(usr);
                if(usr){
                    var doc={
                        username:usr.username,
                        facebook_id:localStorage.getItem('facebook_id')
                    };
                    new model.facebook_account(doc)
                    .save(null,{method:'insert'})
                    .then(function (facebook_usr) {  
                        res.render('user_profile_new');
                    }).catch(function (err) {  
                       console.log(err); 
                    });
                }
            }).catch(function (err) {  
                console.log(err);
            });
        },
        meFacebook:function (req,res) {  
            graph.setAccessToken(localStorage.getItem('facebook_access_token'));
            graph.setVersion("2.2");
            var params = { fields: "name,gender,email" };
            graph.get("me", params, function (err, user) {
                model.facebook_account.where({ facebook_id: user.id }).fetch().then(function (usr) {
                    usr=JSON.stringify(usr);
                    usr=JSON.parse(usr);
                    if(usr){
                        res.send(usr).status(200);
                    }else{
                        res.send(409);
                    }
                }).catch(function (err) {  
                        console.log(err);
                });
            });
           
        },
        companyPages:function (req,res) {  
            model.penjual.where(true).fetchAll()
            .then(function (results) {
            results = JSON.stringify(results);
            results = JSON.parse(results);
            res.render('pages/company', { 
                title       : 'Shop',
                results     : results,
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                config      : req.config.get('application'),    
                helpers     : req.handlebars.helpers,
                page_url    : req.config.get('application').base_url,
                show_footer : "show_footer"
            });
            }).catch(function(err){
                console.log(err);
            });
        },
        profile:function (req,res) {  
            res.redirect('/pembeli/panel');
        },
        checkoutAction:function (req,res) {  
                // if there is no items in the cart then render a failure
                if(!req.session.cart){
                    req.session.message      = "The are no items in your cart. Please add some items before checking out";
                    req.session.message_type = "danger";
                    res.redirect("/cart");
                    return;
                }
                var id=common.generateId();
                var cart = JSON.stringify(req.session.cart);
                cart=JSON.parse(cart);
                console.log(cart)
                var details=[];
                var order_total =0;
                for(var i in cart){
                    order_total+=parseInt(cart[i].quantity)*parseInt(cart[i].item_price);
                    details.push({
                        id:common.generateId(),
                        order_id:id,
                        product_by:cart[i].product_by,
                        product_name:cart[i].title,
                        price:parseInt(cart[i].item_price),
                        qty:parseInt(cart[i].quantity),
                        product_id:parseInt(cart[i].product_id)
                    })
                }

                // new order doc
                var order_doc = { 
                    id             : id,
                    order_by       : req.session.users_name,
                    order_total    : req.session.total_cart_amount,
                    order_email    : req.session.user,
                    order_firstname: req.body.ship_firstname,
                    order_lastname : req.body.ship_lastname,
                    order_addr1    : req.body.ship_addr1,
                    order_addr2    : req.body.ship_addr2,
                    order_country  : req.body.ship_country,
                    order_state    : req.body.ship_state,
                    order_postcode : req.body.ship_postcode,
                    order_date     : new Date(),
                    order_verification : false,
                    order_total    : order_total,
                    purchase       : false
                };
               
                knex.transaction(function(trx) {
                    knex('orders').transacting(trx).insert(order_doc)
                        .then(function(data){
                            return  knex('order_details').transacting(trx)
                            .insert(details)
                        })
                        .then(trx.commit)
                        .catch(trx.rollback);
                    })
                    .then(function(resp) {
                        console.log('Transaction order complete.');
                        res.redirect('/orders/payment');
                    })
                    .catch(function(err) {
                        console.error(err);
                    });

        },
        orderInformasi:function (req,res) {  
            model.orders.where('order_by',req.session.users_name).orderBy('order_state','DESC').fetchAll().then(function(orders){
            orders=JSON.stringify(orders);
            orders=JSON.parse(orders);
            res.render('pembeli/informasi_pemesanan', { 
                title: 'Cart', 
                orders: orders, 
                config: req.config.get('application'),
                session: req.session,
                message: common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers: req.handlebars.helpers,
                show_footer: "show_footer"
            });
            })
          
        },
        buatPermintaan:function (req,res) {  
             if(req.method==='GET'){
                res.render('pembeli/buat_permintaan', { 
                    title: 'Permintaan', 
                    // orders: orders, 
                    config: req.config.get('application'),
                    session: req.session,
                    message: common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    helpers: req.handlebars.helpers,
                    show_footer: "show_footer"
                });   
            }
            else if(req.method==='POST'){
                var body=req.body;
                var doc={
                    id:common.generateId(),
                    name:body.name,
                    kuantitas:body.kuantitas,
                    satuan:body.lainnya||body.satuan,
                    harga:body.harga,
                    desc:body.desc,
                    province:body.province,
                    city:body.city,
                    address:body.address,
                    create_by:req.session.users_name
                }

                knex.transaction(function(trx) {
                    knex('permintaan').transacting(trx).insert(doc)
                    .then(trx.commit)
                    .catch(trx.rollback);
                })
                .then(function(resp) {
                    console.log('Transaction complete.');
                    res.redirect('/');
                })
                .catch(function(err) {
                    console.error(err);
                });

            

            }
        },
        paymentOrders:function(req,res){
            model.orders.query(function(q){
                q.where({order_by:req.session.users_name})
            }).fetchAll().then(function(orders){
                orders=JSON.stringify(orders);
                orders=JSON.parse(orders);
                res.render('pembeli/payment_orders', { 
                    title: 'Cart', 
                    orders: orders, 
                    config: req.config.get('application'),
                    session: req.session,
                    message: common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    helpers: req.handlebars.helpers,
                    show_footer: "show_footer"
                });
            })
        },
        orderDetails:function(req,res){
             knex('orders')
            .join('order_details', 'orders.id', '=', 'order_details.order_id')
            .select('orders.order_by','order_details.*')
            .where('order_details.order_id','=',req.params.id)
            .andWhere('orders.order_by',req.session.users_name)
            .then(function (orders) { 
                orders=JSON.stringify(orders);
                orders=JSON.parse(orders);
                res.render('pembeli/order_details', { 
                    title: 'Cart', 
                    orders: orders, 
                    config: req.config.get('application'),
                    session: req.session,
                    message: common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    helpers: req.handlebars.helpers,
                    show_footer: "show_footer"
                });

            });
           
        },
        timeline:function(req,res){
            if(req.method==='GET'){
                knex('users')
                .join('post', 'users.username', '=', 'post.author')
                .join('penjual', 'users.username', '=', 'penjual.username')
                // .join('pembeli', 'users.username', '=', 'pembeli.username')
                .select('users.*','post.*','penjual.*')
                .then(function (data) { 
                    data = JSON.stringify(data);
                    data = JSON.parse(data);
                    res.render('pembeli/timeline', { 
                        title       : 'Timeline',
                        user        : data[0],
                        session     : req.session,
                        message     : common.clear_session_value(req.session, "message"),
                        message_type: common.clear_session_value(req.session, "message_type"),
                        config      : req.config.get('application'),
                        helpers     : req.handlebars.helpers,
                        page_url    : req.config.get('application').base_url,
                        show_footer : "show_footer"
                    });
                });
            }
        },
        timelineLike:function(req,res){
            var doc = {
                id:common.generateId(),
                post_id:req.body.id,
                user_like:req.session.users_name
            }
            knex.transaction(function(trx) {
                knex('likes').transacting(trx).insert(doc)
                .then(trx.commit)
                .catch(trx.rollback);
            })
            .then(function(resp) {
                console.log('Transaction complete.');
                res.send(200);
            })
            .catch(function(err) {
                res.send(409)
            });
        },
        permintaan:function(req,res){
            model.permintaan.query(function(q){
                q.where('create_by',req.session.users_name)
            }).fetchAll().then(function(permintaan){
                permintaan=JSON.stringify(permintaan);
                permintaan=JSON.parse(permintaan);
                  res.render('pembeli/permintaan', { 
                    title: 'Permintaan', 
                    permintaan: permintaan, 
                    config: req.config.get('application'),
                    session: req.session,
                    message: common.clear_session_value(req.session, "message"),
                    message_type: common.clear_session_value(req.session, "message_type"),
                    helpers: req.handlebars.helpers,
                    show_footer: "show_footer"
                });
            });
        },
        getLikesCount:function(req,res){
           knex('post')
            .join('likes', 'post.id', '=', 'likes.post_id')
            .count()
            .where('post.id','=',req.params.id)
            .then(function (count) { 
                count=JSON.stringify(count);
                count=JSON.parse(count);
                res.send(count[0].count);
            });
        },
        timelineList:function(req,res){
            knex('users')
            .join('post', 'users.username', '=', 'post.author')
            .join('penjual', 'users.username', '=', 'penjual.username')
            .select('users.*','post.*','post.id as postid','penjual.*')
            .then(function (data) { 
                data = JSON.stringify(data);
                data = JSON.parse(data);
                res.send(data);
            });
        }


}


