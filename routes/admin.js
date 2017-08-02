var express = require('express');
var common = require('./common');
var router = express.Router();
var model=require('.././model/model');
var controller=require('../controller').admin;
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
router.get('/',common.restrict_admin,function (req,res) {  
    res.render('admin/index', { 
                title       : 'Shop',
                // results     : results,
                session     : req.session,
                message     : common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                config      : req.config.get('application'),
                helpers     : req.handlebars.helpers,
                page_url    : req.config.get('application').base_url,
                show_footer : "show_footer"
            });
});
router.get('/auth/:username',common.restrict_admin,function(req,res,next){


        var params=req.params;
        
        knex.transaction(function(trx) {
            knex('user_account').where('username','=',params.username).select('confirmation').then(function(data){
                data=JSON.stringify(data);
                data=JSON.parse(data);
                var confirmation=!data[0].confirmation;
                console.log(confirmation)
                var doc={
                    confirmation:confirmation
                }
                knex('user_account').transacting(trx).update(doc).where('username','=',params.username)
                .then(trx.commit)
                .catch(trx.rollback);
            });
            
        })
        .then(function(resp) {
            var message ='Confirmation Status Change Complete.'; 
            console.log(message);
            req.session.message = message;
            req.session.message_type = "success";
            res.redirect('/protected/users');
        })
        .catch(function(err) {
            console.error(err);
        });
        
});
router.get('/users',common.restrict_admin,function(req,res,next){
    model.user_account.where(true).fetchAll().then(function(results){
        results=JSON.stringify(results);
        results=JSON.parse(results);
        
        res.render('admin/users', { 
                title       : 'User Control',
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
   
})
router.route('/login').get(function(req,res){
    res.render('admin/login', { 
        title       : 'User Control',
        // results     : results,
        session     : req.session,
        message     : common.clear_session_value(req.session, "message"),
        message_type: common.clear_session_value(req.session, "message_type"),
        config      : req.config.get('application'),
        helpers     : req.handlebars.helpers,
        page_url    : req.config.get('application').base_url,
        show_footer : "show_footer"
    });
}).post(function(req,res){
    model.admin_account.query(function(q){
        q.where('username',req.body.username).andWhere('password',req.body.password);
    }).fetch().then(function(data){
        data=JSON.stringify(data);
        data=JSON.parse(data);
        
        if(data){
            req.session.users_name = data.username;
            req.session.user_id    = data.id;
            req.session.user_type = 'admin';
            req.session.user      = data.username;
              res.redirect('/protected');
        }else{
            res.redirect('/protected/login')
            }

    })
});

router.post('/admin/insert',function(req,res){
                var body=req.body;
                console.log(body)
                var doc={
                    username:body.users_name,
                    fullname:body.name,
                    password:body.password
                }
                knex.transaction(function(trx) {
                 knex('admin_account').transacting(trx).insert(doc)
                    .then(trx.commit)
                    .catch(trx.rollback);
                })
                .then(function(resp) {
                    console.log('Transaction input admin Complete.');
                    res.redirect('/protected');
                })
                .catch(function(err) {
                    console.error(err);
                });
});
router.route('/order/control').get(common.restrict_admin,function(req,res){
    model.orders.where(true).fetchAll().then(function(orders){
        orders=JSON.stringify(orders);
        orders=JSON.parse(orders);
        console.log(orders); 
        res.render('admin/order_control', { 
            title       : 'User Control',
            orders     : orders,
            session     : req.session,
            message     : common.clear_session_value(req.session, "message"),
            message_type: common.clear_session_value(req.session, "message_type"),
            config      : req.config.get('application'),
            helpers     : req.handlebars.helpers,
            page_url    : req.config.get('application').base_url,
            show_footer : "show_footer"
         });
    });
   
});
router.get('/verification/:id/:cond',common.restrict_admin,function(req,res){
    model.orders.where({id:req.params.id}).fetch().then(function(order){
    order=JSON.stringify(order);
    order=JSON.parse(order);
    console.log(order.order_verification)
    console.log('masuk')
    knex.transaction(function(trx) {
        knex('orders').transacting(trx)
        .where('id','=',req.params.id)
        .update({order_verification:req.params.cond})
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .then(function(resp) {
            console.log('Transaction edit complete.');
            res.redirect('/protected/order/control');
        })
        .catch(function(err) {
            console.error(err);
        });
    })
});


module.exports = router;
