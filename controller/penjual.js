var model=require('.././model/model');
var multer  = require('multer')
var upload = multer({ dest: 'public/uploads/' });
var common = require('.././routes/common');
var fs = require('fs');
var path = require('path');
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

function gender(options){
    if(options==='male'){
        return true;
    }
    return false;
}

module.exports={
    index:function (req,res) {  
        res.redirect('/penjual/orders');   
    },
    uploadFileSupporting:function (req,res,next) {  
    	var fs = require('fs');
            var path = require('path');

            if(req.file){
                // check for upload select
                var upload_dir = path.join("public/uploads", req.body.directory);
                
                // Check directory and create (if needed)
                common.check_directory_sync(upload_dir);
                
                var file = req.file;
                var source = fs.createReadStream(file.path);
                var dest = fs.createWriteStream(path.join(upload_dir, file.originalname.replace(/ /g,"_")));

                // save the new file
                source.pipe(dest);
                source.on("end", function() {});

                // delete the temp file.
                fs.unlink(file.path, function (err) {});

                var image_path = path.join("/uploads", req.body.directory, file.originalname.replace(/ /g,"_"));
            }
    },
    register:function (req,res,next) {  
        
            if(req.file){
                // check for upload select
                var upload_dir = path.join("public/uploads/company/",req.body.username);
                // Check directory and create (if needed)
                common.check_directory_sync(upload_dir);
                var file = req.file;
                var source = fs.createReadStream(file.path);
                var pathfile =path.join(upload_dir, file.originalname.replace(/ /g,"_"));
                var dest = fs.createWriteStream(pathfile);
                // save the new file
                source.pipe(dest);
                source.on("end", function() {});

                // delete the temp file.
                fs.unlink(file.path, function (err) {});

                var doc={
                    id:common.generateId(),
                    username:req.body.username,
                    email:req.body.email  ,
                    fullname:req.body.fullname,
                    password:req.body.cpassword,
                    confirm_token:'',
                    confirmation:false,
                    gender:gender(req.body.gender),
                    photo:'/uploads/company/'+req.body.username+'/'+file.originalname,
                    address:req.body.address,
                    province:req.body.province,
                    city:req.body.city,
                    district:req.body.district,
                    postalcode:req.body.postalcode,
                    sub_district:req.body.sub_district,
                    phone:req.body.phone,
                    company_name:req.body.companyname,
                    company_desc:req.body.desc,
                };

                var user ={
                    id:doc.id,
                    username:doc.username,
                    fullname:doc.fullname,
                    email:doc.email
                };
                var user_account={
                    username:doc.username,
                    password:doc.password,
                    confirm_token:doc.confirm_token,
                    confirmation:doc.confirmation
                };
                var penjual={
                    username:doc.username,
                    gender:doc.gender,
                    photo:doc.photo,
                    address:doc.address,
                    province:doc.province,
                    city:doc.city,
                    district:doc.district,
                    postal_code:doc.postalcode,
                    sub_district:doc.sub_district,
                    phone:doc.phone,
                    company_name:doc.company_name,
                    company_desc:doc.company_desc
                };

                knex.transaction(function(trx) {
                    knex('users').transacting(trx).insert(user)
                    .then(function(resp) {
                    return knex('user_account')
                        .transacting(trx)
                        .insert(user_account);
                        
                    }).then(function (resp) {  
                       return knex('penjual')
                        .transacting(trx)
                        .insert(penjual)
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
    },
    
    editUserById:function (req,res) {  
        model.users.where('username',req.params.id).fetch().then(function (user) {  
            if(user.get('email')!=req.session.user && req.session.is_penjual==false){
                req.session.message = "Access denied";
                req.session.message_type = "danger";
                res.redirect('/Users/');
                return;
            }
            res.render('user_edit', { 
                title: 'User edit',
                user: user,
                session: req.session,
                message: common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers: req.handlebars.helpers,
                config: req.config.get('application')
            }).catch(function (err) {  
                console.log(err);
            });
	    });
    },
    apiValidatePermalink:function (req,res) {  
        var query = {};
		query = {'product_permalink': req.body.permalink};
        model.products.where(query).count().then(function (products) {
            if(products > 0){
                res.writeHead(400, { 'Content-Type': 'application/text' }); 
                res.end('Permalink already exists');
            }else{
                res.writeHead(200, { 'Content-Type': 'application/text' }); 
                res.end('Permalink validated successfully');
            }
        }).catch(function (err) {  
            console.log(err);
        });
    },
    productInsert:function (req,res) {  
        var products_index = req.products_index;
        var doc = { 
            product_permalink: req.body.frm_product_permalink,
            product_title: req.body.frm_product_title,
            product_price: req.body.frm_product_price,
            product_description: req.body.frm_product_description,
            product_published: req.body.frm_product_published,
            product_featured: req.body.frm_product_featured,
            product_added_date: new Date(),
            product_by :req.session.users_name
        };

        model.products.where('product_permalink',req.body.frm_product_permalink).count().then(function(product){
            if(product > 0 && req.body.frm_product_permalink != ""){
                // permalink exits
                req.session.message = "Permalink already exists. Pick a new one.";
                req.session.message_type = "danger";
                // keep the current stuff
                req.session.product_title = req.body.frm_product_title;
                req.session.product_description = req.body.frm_product_description;
                req.session.product_price = req.body.frm_product_price;
                req.session.product_permalink = req.body.frm_product_permalink;
                // redirect to insert
                res.redirect('/penjual/insert');
            }else{

                new model.products(doc).save(null,{method:'insert'}).then(function(newDoc){
                    // create lunr doc
                        var lunr_doc = { 
                            product_title: req.body.frm_product_title,
                            product_description: req.body.frm_product_description,
                            id: newDoc.get('id')
                        };
                        // add to lunr index
                        products_index.add(lunr_doc);
                        req.session.message = "New product successfully created";
                        req.session.message_type = "success";
                        // redirect to new doc
                        res.redirect('/penjual/product/edit/' + newDoc.get('id'));
                }).catch(function (err) {  
                        console.error("Error inserting document: " + err);
                        // keep the current stuff
                        req.session.product_title = req.body.frm_product_title;
                        req.session.product_description = req.body.frm_product_description;
                        req.session.product_price = req.body.frm_product_price;
                        req.session.product_permalink = req.body.frm_product_permalink;
                        req.session.message = "Error: " + err;
                        req.session.message_type = "danger";
                        // redirect to insert
                        res.redirect('/penjual/insert');
                });
                
            }
        }).catch(function (err) {  


        });
        // db.products.count({'product_permalink': req.body.frm_product_permalink}, function (err, product) {
            
        // });
    },
    products:function (req,res,next) {  
        // get the top results
        model.products.query(function(q){
            q.where(true).andWhere('product_by',req.session.users_name).orderBy('product_added_date')
        })
        .fetchAll().then(function (top_results) {  
        top_results=JSON.stringify(top_results);
        top_results=JSON.parse(top_results);
            res.render('products', { 
                title: 'Cart', 
                "top_results": top_results, 
                session: req.session,
                config: req.config.get('application'),
                message: common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers: req.handlebars.helpers,
                show_footer: "show_footer"
            });
        }).catch(function (err) {  
            console.log(err);
        });
    },
    orders:function (req,res,next) {  
        // Top 10 products
         knex('orders')
        .join('order_details', 'orders.id', '=', 'order_details.order_id').distinct()
        .select('orders.*','order_details.product_by')
        .where('order_details.product_by','=',req.session.users_name)
        .andWhere('orders.order_verification','=',true)
        .then(function (orders) { 
            orders=JSON.stringify(orders);
            orders=JSON.parse(orders);
            res.render('orders', { 
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
    viewOrderById:function (req,res) { 
        model.orders.where({id: req.params.id})
        .fetch().then(function (result) {
		result=JSON.stringify(result);
        result=JSON.parse(result);
        req.session.order_id=result.id;
		if(result!==null){
			res.render('order', { 
				title: 'View order', 
				"result": result,    
				config: req.config.get('application'),      
				session: req.session,
				message: common.clear_session_value(req.session, "message"),
				message_type: common.clear_session_value(req.session, "message_type"),
				editor: true,
				helpers: req.handlebars.helpers
			});
		}
		else{	
			req.session.message = "Order not found";
			req.session.message_type = "danger";
			res.redirect('/penjual/orders');
		}
	    });
    },
    viewOrderDetailsById:function(req,res){

        console.log(req.session.users_name)
        model.order_details.query(function(q){
            q.where({order_id: req.params.id}).andWhere('product_by',req.session.users_name);
        })
        .fetchAll().then(function (result) {
		result=JSON.stringify(result);
        result=JSON.parse(result);
        req.session.order_id=result[0].order_id;
		if(result!==null){
			res.render('order_details', { 
				title: 'View order', 
				result: result,    
				config: req.config.get('application'),      
				session: req.session,
				message: common.clear_session_value(req.session, "message"),
				message_type: common.clear_session_value(req.session, "message_type"),
				editor: true,
				helpers: req.handlebars.helpers
			});
		}
		else{	
			req.session.message = "Order not found";
			req.session.message_type = "danger";
			res.redirect('/penjual/orders');
		}
	    });
    },
    addtocart:function (req,res,next) {  
         var _ = require('underscore');
        var product_quantity = req.body.product_quantity ? parseInt(req.body.product_quantity): 1;
        // setup cart object if it doesn't exist
        if(!req.session.cart){
            req.session.cart = {};
        }

        model.products.where({id: req.body.product_id}).fetch().then(
            function (product) {
                product=JSON.stringify(product);
                product=JSON.parse(product);
            if(product){
                var product_price = parseFloat(product.product_price).toFixed(2);
                // if exists we add to the existing value
                if(req.session.cart[req.body.product_id]){
                    req.session.cart[req.body.product_id]["quantity"] = req.session.cart[req.body.product_id]["quantity"] + product_quantity;
                    req.session.cart[req.body.product_id]["total_item_price"] = product_price * req.session.cart[req.body.product_id]["quantity"];
                }
                else{
                    // Doesnt exist so we add to the cart session
                    req.session.cart_total_items = req.session.cart_total_items + product_quantity;
                    
                    // new product deets
                    var product_obj = {};
                    product_obj.title = product.product_title;
                    product_obj.quantity = product_quantity;
                    product_obj.item_price = product_price;
                    if(product.product_permalink){
                        product_obj.link = product.product_permalink;
                    }else{
                        product_obj.link = product.id;
                    }
                    product_obj.product_by=product.product_by;
                    product_obj.product_id=product.id;
                    // new product id
                    var cart_obj = {};
                    cart_obj[product.id] = product_obj;
                    
                    // merge into the current cart
                    _.extend(req.session.cart, cart_obj);
                }
                
                // update total cart amount
                common.update_total_cart_amount(req, res);
                
                // update how many products in the shopping cart
                req.session.cart_total_items = Object.keys(req.session.cart).length;
                res.status(200).json({message: 'Cart successfully updated', "total_cart_items": Object.keys(req.session.cart).length});
            }else{
                res.status(400).json({message: 'Error updating cart. Please try again.'});
            }
        });
    },
    newProduct:function (req,res) {  
        res.render('product_new', {
            title: 'New product', 
            session: req.session,
            product_title: common.clear_session_value(req.session, "product_title"),
            product_description: common.clear_session_value(req.session, "product_description"),
            product_price: common.clear_session_value(req.session, "product_price"),
            product_permalink: common.clear_session_value(req.session, "product_permalink"),
            message: common.clear_session_value(req.session, "message"),
            message_type: common.clear_session_value(req.session, "message_type"),
            editor: true,
            helpers: req.handlebars.helpers,
            config: req.config.get('application')
	    });
    },
    editProductById:function (req,res) {  
        if(req.method==='GET'){
            var classy = require("markdown-it-classy");
            var markdownit = req.markdownit;
            markdownit.use(classy);
            common.get_images(req.params.id, req, res, function (images){
                model.products.where({id: req.params.id}).fetch().then(function (result) {
                    result=JSON.stringify(result);
                    result=JSON.parse(result);
                    res.render('product_edit', { 
                        title: 'Edit product', 
                        "result": result,
                        images: images,          
                        session: req.session,
                        message: common.clear_session_value(req.session, "message"),
                        message_type: common.clear_session_value(req.session, "message_type"),
                        config: req.config.get('application'),
                        editor: true,
                        helpers: req.handlebars.helpers
                    });
                });
            });
        }
        else if(req.method==='POST'){
            var products_index = req.products_index;
            model.products.where({'product_permalink': req.body.frm_product_permalink}).count().then(function(product) {
                if(product > 0 && req.body.frm_product_permalink != ""){
                    // permalink exits
                    req.session.message = "Permalink already exists. Pick a new one.";
                    req.session.message_type = "danger";
                    // keep the current stuff
                    req.session.product_title = req.body.frm_product_title;
                    req.session.product_description = req.body.frm_product_description;
                    req.session.product_price = req.body.frm_product_price;
                    req.session.product_permalink = req.body.frm_product_permalink;
                    req.session.product_featured = req.body.frm_product_featured;
                    // redirect to insert
                    res.redirect('/penjual/product/edit/' + req.body.frm_product_id);
                }else{
                    common.get_images(req.body.frm_product_id, req, res, function (images){
                        var product_doc = {
                            product_title: req.body.frm_product_title,
                            product_description: req.body.frm_product_description,
                            product_published: req.body.frm_product_published,
                            product_price: req.body.frm_product_price,
                            product_permalink: req.body.frm_product_permalink,
                            product_featured: req.body.frm_product_featured||''
                        }
                        // if no featured image
                        if(!product_doc.product_image){
                            if(images.length > 0){
                                product_doc["product_image"] = images[0].path;
                            }else{
                                product_doc["product_image"] = "/uploads/placeholder.png";
                            }
                        }
                        knex.transaction(function(trx) {
                            knex('products').transacting(trx).update(product_doc).where('id','=',req.body.frm_product_id)
                            .then(trx.commit)
                            .catch(trx.rollback);
                        })
                        .then(function(resp) {
                            console.log('Transaction complete.');
                            req.session.message = "Edit product complete.";
                            req.session.message_type = "success";
                            res.redirect('/penjual/product/edit/'+req.body.frm_product_id);
                        })
                        .catch(function(err) {
                            console.error("Failed to save product: " + err)
                            req.session.message = "Failed to save. Please try again";
                            req.session.message_type = "danger";
                            res.redirect('/penjual/product/edit/' + req.body.frm_product_id);
                        });
                    });
                }
            }).catch(function(err){
                console.log(err);
            });
        }
    },
    fileUpload:function (req,res,next) {  
        	var fs = require('fs');
            var path = require('path');
            if(req.file){
                // check for upload select
                var upload_dir = path.join("public/uploads", req.body.directory);
                // Check directory and create (if needed)
                common.check_directory_sync(upload_dir);
                var file = req.file;
                var source = fs.createReadStream(file.path);
                var dest = fs.createWriteStream(path.join(upload_dir, file.originalname.replace(/ /g,"_")));

                // save the new file
                source.pipe(dest);
                source.on("end", function() {});

                // delete the temp file.
                fs.unlink(file.path, function (err) {});
            
                // get the product form the DB
                model.products.where({id: req.body.directory}).fetch().then(function (product) {
                    product=JSON.stringify(product);
                    product=JSON.parse(product);
                    var image_path = path.join("/uploads", req.body.directory, file.originalname.replace(/ /g,"_"));
                    // if there isn't a product featured image, set this one
                    if(!product.product_image){
                        new model.products({id: req.body.directory,product_image: image_path})
                        .save(null,{method:'update'})	
                        .then(function (numReplaced) {
                            req.session.message = "File uploaded successfully";
                            req.session.message_type = "success";
                            res.redirect('/penjual/product/edit/' + req.body.directory);
                        });
                    }else{
                        req.session.message = "File uploaded successfully";
                        req.session.message_type = "success";
                        res.redirect('/penjual/product/edit/' + req.body.directory);
                    }
                });
            }else{
                req.session.message = "File upload error. Please select a file.";
                req.session.message_type = "danger";
                res.redirect('/penjual/product/edit/' + req.body.directory);
            }
    },
    deleteImage:function (req,res) {  
         var fs = require('fs');
        var path = require('path');
        
        // get the product_image from the db
        model.products.where({id: req.body.product_id}).fetch().then(function (product) {
            if(req.body.product_image == product.product_image){
                // set the produt_image to null
                new model.products({ id: req.body.product_id,product_image: null}).save(null,{method:'update'})
                .then(function (numReplaced) {
                    // remove the image from disk
                    fs.unlink(path.join("public", req.body.product_image), function(err){
                        if(err){
                            res.status(400).json({message: 'Image not removed, please try again.'});
                        }else{
                            res.status(200).json({message: 'Image successfully deleted'});
                        }
                    });
                });
            }else{
                // remove the image from disk
                fs.unlink(path.join("public", req.body.product_image), function(err){
                    if(err){
                        res.status(400).json({message: 'Image not removed, please try again.'});
                    }else{
                        res.status(200).json({message: 'Image successfully deleted'});
                    }
                });
            }
        });
    },
    setAsMainImage:function (req,res) {  
         var fs = require('fs');
        var path = require('path');
        // update the product_image to the db
        new model.products({ id: req.body.product_id,product_image: req.body.product_image}).save(null,{method:'update'})
        .then(function (numReplaced) {
            res.status(200).json({message: 'Main image successfully set'});
        }).catch(function (err) {  
            res.status(400).json({message: 'Unable to set as main image. Please try again.'});
        });
    },
    permintaan:function (req,res) {  
         model.permintaan.where(true).fetchAll().then(function(orders){
            orders=JSON.stringify(orders);
            orders=JSON.parse(orders);
            console.log(orders)
            res.render('pages/permintaan', { 
                title: 'Permintaan', 
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
    updateStatusOrder:function(req,res){
        var orders_index = req.orders_index;
                var doc={
                    id:req.session.order_id,
                    order_status:req.body.status
                };
                knex.transaction(function(trx) {
                    knex('order_details').transacting(trx).update(doc)
                    .then(trx.commit)
                    .catch(trx.rollback);
                })
                .then(function(resp) {
                    console.log('Change Order Status complete.');
                    req.session.message = "Change Order Status complete.";
                    req.session.message_type = "success";
                    res.redirect('/penjual/order/view/'+doc.id);
                })
                .catch(function(err) {
                    console.error(err);
                });
   
    },
    timeline:function(req,res){
        if(req.method==='GET'){
                knex('users')
                .join('post', 'users.username', '=', 'post.author')
                .join('penjual', 'users.username', '=', 'penjual.username')
                // .join('pembeli', 'users.username', '=', 'pembeli.username')
                .select('users.*','post.*','penjual.*')
                .where('users.username','=',req.session.users_name)
                .then(function (data) { 
                    data = JSON.stringify(data);
                    data = JSON.parse(data);
                    console.log(data)
                    res.render('pages/timeline', { 
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
            else if(req.method==='POST'){
                if(req.file){
                    // check for upload select
                    var upload_dir = path.join("public/uploads/post/",req.session.users_name);
                    // Check directory and create (if needed)
                    common.check_directory_sync(upload_dir);
                    var file = req.file;
                    var source = fs.createReadStream(file.path);
                    var pathfile =path.join(upload_dir, file.originalname.replace(/ /g,"_"));
                    var dest = fs.createWriteStream(pathfile);
                    // save the new file
                    source.pipe(dest);
                    source.on("end", function() {});

                    // delete the temp file.
                    fs.unlink(file.path, function (err) {});
                    var doc={
                        id:common.generateId(),
                        image:'/uploads/post/'+req.session.users_name+'/'+file.originalname,
                        title:req.body.title,
                        content:req.body.content,
                        author:req.session.users_name
                    };
                    knex.transaction(function(trx) {
                        knex('post').transacting(trx).insert(doc)
                        .then(trx.commit)
                        .catch(trx.rollback);
                    })
                    .then(function(resp) {
                        console.log('Transaction complete.');
                        req.channel.publish('post','asas');
                        res.redirect('/penjual/timeline');
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
            }
        }
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
    },
    setStatusOrder:function(req,res){

        var doc={
            status:req.body.order_status
        }
        
         knex.transaction(function(trx) {
            knex('order_details').transacting(trx).update(doc).where('id','=',req.body.detail_id)
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .then(function(resp) {
            console.log('Transaction complete.');
            res.redirect('/penjual/orders');
        })
        .catch(function(err) {
            console.error(err);
        });
    },
    katalog:function(req,res){
       if(req.method==='GET'){ 
            res.render('penjual/katalog', { 
                title       : 'Katalog',
                // user        : data[0],
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
            if(req.file){
                // check for upload select
                var upload_dir = path.join("public/uploads/katalog/",req.session.users_name);
                // Check directory and create (if needed)
                common.check_directory_sync(upload_dir);
                var file = req.file;
                var source = fs.createReadStream(file.path);
                var pathfile =path.join(upload_dir, file.originalname.replace(/ /g,"_"));
                var dest = fs.createWriteStream(pathfile);
                // save the new file
                source.pipe(dest);
                source.on("end", function() {});

                // delete the temp file.
                fs.unlink(file.path, function (err) {});
                var body= req.body;

                var doc={
                    title:body.title,
                    desc:body.desc,
                    product_permalink:body.permalink,
                    file:'/uploads/katalog/'+req.body.username+'/'+file.originalname,
                    upload_by:req.session.users_name
                }
                knex.transaction(function(trx) {
                    knex('katalog').transacting(trx).insert(doc)
                    .then(trx.commit)
                    .catch(trx.rollback);
                })
                .then(function(resp) {
                    console.log('Transaction complete.');
                    res.redirect('/penjual/katalog/new');
                })
                .catch(function(err) {
                    console.error(err);
                });
            }
        }
    },
    katalogList:function(req,res){
         knex('users')
        .join('penjual','users.username', '=', 'penjual.username')
         .join('katalog', 'penjual.username', '=', 'katalog.upload_by')
        .select('users.*','katalog.*')
        .where('users.username','=',req.session.users_name)
        .then(function (katalog) {  
            res.render('penjual/katalog_list', { 
                title: 'Katalog', 
                katalog: katalog, 
                config: req.config.get('application'),
                session: req.session,
                message: common.clear_session_value(req.session, "message"),
                message_type: common.clear_session_value(req.session, "message_type"),
                helpers: req.handlebars.helpers,
                show_footer: "show_footer"
            });
        });
    },
    db:function(req,res){
        
        var users=[];
       users[0]= {
            username:'herris',
            email :'a@a.com',
            fullname:'aa'
        }
        users[1]= {
            username:'herris1',
            email :'b@a.com',
            fullname:'aa'
        }
        users[2]= {
            username:'herris2',
            email :'c@a.com',
            fullname:'aa'
        }
        var user_account=[];
        user_account[0]={
            username:'herris',
            password:'1',
            confirmation:true
        }
        user_account[1]={
            username:'herris1',
            password:'1',
            confirmation:true
        }
        user_account[2]={
            username:'herris2',
            password:'1',
            confirmation:true
        }
        var pembeli;
        var penjual=[];
        pembeli={
            username:'herris',
            gender:true,
            phone:'',
            address:'',
            province:'',
            district:'',
            postal_code:'',
            sub_district:''
        }
        penjual[0]={
            username:'herris1',
            gender:true,
            phone:'',
            address:'',
            province:'',
            district:'',
            postal_code:'',
            sub_district:''
        }
        penjual[1]={
            username:'herris2',
            gender:true,
            phone:'',
            address:'',
            province:'',
            district:'',
            postal_code:'',
            sub_district:'',
            account_number:'624-528-6448',
            bank_name:'BCA',
            bank_branch:'Asia Megamas Medan',
            account_name:'Herris Suhendra'
        }
 
        knex.transaction(function(trx) {
        knex('users').transacting(trx).insert(users)
            .then(function(resp) {
                return knex('user_account').transacting(trx).insert(user_account)
            })
            .then(function(resp) {
                return knex('pembeli').transacting(trx).insert(pembeli)
            })
            .then(function(resp) {
                return knex('penjual').transacting(trx).insert(penjual)
            })
            .then(function(resp){
                return knex('admin_account').transacting(trx).insert({username:'herris',email:'herris@gmail.com',fullname:'Herris Suhendra',password:'123'});
            })
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .then(function(resp) {
            console.log('Transaction complete.');
            res.redirect('/')
        })
        .catch(function(err) {
        console.error(err);
        });
    }   
    
}