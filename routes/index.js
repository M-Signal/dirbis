var express = require('express');
var router = express.Router();
var common = require('./common');
var model  = require('.././model/model');
var controller=require('../controller').pembeli;
var PController=require('../controller').penjual;
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy,
GoogleStrategy = require('passport-google-oauth2').Strategy;
var requestify = require('requestify'); 
var multer  = require('multer')
var upload = multer({ dest: 'public/uploads/' });
var localStorage = require('localStorage');

router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
router.get('/auth/facebook/callback',passport.authenticate('facebook', { successRedirect: '/auth', failureRedirect: '/login' }));
router.route('/auth').get(controller.auth);
router.get('/me/facebook',controller.meFacebook);
// The homepage of the site
router.get('/',controller.index);
router.get('/pembeli/panel',common.check_login_pembeli,controller.panel_pembeli);
router.get('/register',controller.register);
router.post('/pembeli/register',controller.register);
// show an individual product
router.get('/product/:id',controller.searchProductById);
// logout
router.get('/logout', controller.logout);
// search products
router.post('/search', controller.search);
// product list
router.get('/products', restrict, controller.products);
// The homepage of the site
router.get('/cart', controller.cart);
// The homepage of the site
router.get('/checkout', controller.checkout);
// The homepage of the site
router.post('/checkout_action',common.restrict_pembeli, controller.checkoutAction);
router.get('/products/:tag', controller.getProductsByTag);
// login form
router.get('/login', controller.login);
// setup form is shown when there are no users setup in the DB
router.get('/setup',controller.setup);
// login the user and check the password
router.post('/login_action', controller.login_action);
router.post('/register/fb',controller.registerByFb);
router.get('/sess',function (req,res) {  
    res.send(req.session).status(200);
}); 
router.get('/t',function (req,res) { 
   console.log(localStorage.getItem('url'))
})
router.get('/test',function (req,res) {  
     requestify.get('http://127.0.0.1:5000/sess').then(function(response) {
	    // Get the response body
	    var resp = response.getBody();
        res.send(resp);
    });
});
router.get('/pembeli/akun/informasi',common.restrict_pembeli,controller.informasiAkunPembeli);
router.route('/pembeli/akun/edit').post(common.restrict_pembeli,controller.editAccount);
router.get('/pages/products',controller.productsPage);
router.post('/penjual/register',upload.single('upload_file'),PController.register);
router.get('/pages/company',controller.companyPages);
router.get('/profile/:username',common.restrict_profile,controller.profile);
router.route('/pembeli/buat/permintaan')
        .get(common.restrict_pembeli,controller.buatPermintaan)
        .post(common.restrict_pembeli,controller.buatPermintaan);
router.get('/pembeli/orders/payment',common.restrict_pembeli,controller.paymentOrders);
router.get('/pembeli/orders/details/:id',common.restrict_pembeli,controller.orderDetails);
router.get('/timeline',common.restrict_pembeli,controller.timeline);
router.get('/pembeli/permintaan',common.restrict_pembeli,controller.permintaan);
router.post('/timeline/like',controller.timelineLike);
// router.get('/likes/count/:id',controller.likesCount);
router.get('/likes/count/:id',controller.getLikesCount);
router.get('/pembeli/timeline/list',common.restrict_pembeli,controller.timelineList);
// ======================================================================

// The homepage of the site
router.get('/checkout_return', function(req, res, next) {
    var config = req.config.get('application');
    var paypal = require('paypal-express-checkout').init(config.paypal_username, config.paypal_password, config.paypal_signature, config.base_url + '/checkout_return', config.base_url + '/checkout_cancel', true);
    
    paypal.detail(req.query.token, req.query.PayerID, function(err, data, invoiceNumber, price) {
        // check if payment is approved
        var payment_approved = false;
        var order_id         = invoiceNumber;
        var payment_status   = data.PAYMENTSTATUS;
        
        // fully approved
        if(data.PAYMENTSTATUS == "Completed"){
            payment_approved = true;
            payment_message  = "Your payment was successfully completed";
            
            // clear the cart
            if(req.session.cart){
                req.session.cart              = null;
                req.session.order_id          = null;
                req.session.total_cart_amount = 0;
            }
        }
        
        // kinda approved..
        if(data.PAYMENTSTATUS == "Pending"){
            payment_approved = true;
            payment_message  = "Your payment was successfully completed";
            payment_status   = data.PAYMENTSTATUS + " - Reason: " + data.PENDINGREASON;
            
            // clear the cart
            if(req.session.cart){
                req.session.cart              = null;
                req.session.order_id          = null;
                req.session.total_cart_amount = 0;
            }
        }
        
        // set the paymnet message
        var payment_message = data.PAYMENTSTATUS + " : " + data.REASONCODE;
        
        // on Error, set the message and failure
        if (err) {
            payment_approved = false;
            payment_message  = "Error: " + err;
            if(err = "ACK Failure: Payment has already been made for this InvoiceID."){
                payment_message = "Error: Duplicate invoice payment. Please check you have not been charged and try again.";
                if(req.session.cart){
                    req.session.order_id = null;
                }
            }
        }
        
        // catch failure returns
        if(data.ACK == "Failure"){
            payment_approved = false;
            payment_message  = "Error: " + data.L_LONGMESSAGE0;
            if(req.session.cart){
                req.session.order_id = null;
            }
        }
        
        // update the order status
        req.db.orders.update({ _id: invoiceNumber}, { $set: { order_status: payment_status} }, { multi: false }, function (err, numReplaced) {
            req.db.orders.findOne({ _id: invoiceNumber}, function (err, order) {
                var lunr_doc = {
                    order_lastname: order.order_lastname,
                    order_email   : order.order_email,
                    order_postcode: order.order_postcode,
                    id            : order._id
                }; 
                
                // add to lunr index
                req.orders_index.add(lunr_doc);
                
                // show the view
                res.render('checkout', { 
                    title           : "Checkout result",
                    config          : req.config.get('application'),
                    session         : req.session,
                    payment_approved: payment_approved,
                    payment_message : payment_message,
                    helpers         : req.handlebars.helpers,
                    show_footer     : "show_footer"
                });
            });
        });
    });
});
// The homepage of the site
router.get('/checkout_cancel', function(req, res, next) {
    var config = req.config.get('application');
    var paypal = require('paypal-express-checkout').init(config.paypal_username, config.paypal_password, config.paypal_signature, config.base_url + '/checkout_return', config.base_url + '/checkout_cancel', true);
    
    paypal.detail(req.query.token, req.query.PayerID, function(err, data, invoiceNumber, price) {
        // remove the cancelled order
        req.db.orders.remove({_id: invoiceNumber}, {}, function (err, numRemoved) {	
            // clear the order_id from the session so the user can checkout again
            if(req.session.cart){
                req.session.order_id = null;
            }
            
            var payment_approved = false;
            var payment_message  = "Error: Your order was cancelled";
            
            // show the view
            res.render('checkout', { 
                title           : "Checkout cancelled",
                session         : req.session,
                config          : req.config.get('application'),
                payment_approved: payment_approved,
                payment_message : payment_message,
                message         : common.clear_session_value(req.session, "message"),
                message_type    : common.clear_session_value(req.session, "message_type"),
                helpers         : req.handlebars.helpers,
                show_footer     : "show_footer"
            });
        });
    });
});
// export files into .md files and serve to browser
router.get('/export', restrict, function(req, res) {
	var db    = req.db;
	var fs    = require('fs');
	var JSZip = require("jszip");
	
	// dump all articles to .md files. Article title is the file name and body is contents
	db.products.find({}, function (err, results) {
		
		// files are written and added to zip.
		var zip = new JSZip();
		for (var i = 0; i < results.length; i++) {
			// add and write file to zip
			zip.file(results[i].product_title + ".md", results[i].product_description);
		}
		
		// save the zip and serve to browser
		var buffer = zip.generate({type:"nodebuffer"});
		fs.writeFile("data/export.zip", buffer, function(err) {
			if (err) throw err;
			res.set('Content-Type', 'application/zip')
			res.set('Content-Disposition', 'attachment; filename=data/export.zip');
			res.set('Content-Length', buffer.length);
			res.end(buffer, 'binary');
			return;
		});
	});
});
//return sitemap
router.get('/sitemap.xml', function(req, res, next) { 
    var sm = require('sitemap');
    
    common.add_products(req, res, function (err, products){
        var sitemap = sm.createSitemap (
        {
            hostname : req.config.get('application').base_url,
            cacheTime: 600000,                                   // 600 sec - cache purge period 
            urls     : [
                { url: '/', changefreq: 'weekly', priority: 1.0 }
            ]
        });

        var current_urls = sitemap.urls;
        var merged_urls  = current_urls.concat(products);
            sitemap.urls = merged_urls;
        // render the sitemap
        sitemap.toXML( function (err, xml) {
            if (err) {
                return res.status(500).end();
            }
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        });
    });
});
// This is called on all URL's. If the "password_protect" config is set to true
// we check for a login on thsoe normally public urls. All other URL's get
// checked for a login as they are considered to be protected. The only exception
// is the "setup", "login" and "login_action" URL's which is not checked at all.
function restrict(req, res, next){
	var url_path = req.url;
    
    if(url_path.substring(0,12) == "/user_insert"){
		next();
		return;
	}
	// if not a public page we 
	check_login(req, res, next);
}
// does the actual login check
function check_login(req, res, next){
	if(req.session.user){
		next();
	}else{
		res.redirect('/login');
	}
}
function safe_trim(str){
	if(str != undefined){
		return str.trim();
	}else{
		return str;
	}
}
module.exports = router;
