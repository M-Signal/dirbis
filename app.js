var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var handlebars = require('express-handlebars');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var nedb = require('nedb');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var lunr = require('lunr');
var markdownit = require('markdown-it')({html: true,linkify: true,typographer: true});
var moment = require('moment');
var nedb_store = require('nedb-session-store')(session);
var numeral = require('numeral');
var config = require('config');
var pg = require('pg');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var localStorage = require('localStorage');

// setup lunr indexing
var products_index = lunr(function () {
    this.field('product_title', { boost: 10 });
    this.field('product_description');
});
var orders_index = lunr(function () {
    this.field('order_email', { boost: 10 });
    this.field('order_lastname', { boost: 5 });
    this.field('order_postcode');
});
// require the routes
var index = require('./routes/index');
var penjual = require('./routes/penjual');
var admin = require('./routes/admin');

var app = express();
server=require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
app.engine('hbs', handlebars({ extname: 'hbs', defaultLayout: 'layout.hbs' }));
app.set('view engine', 'hbs');
// helpers for the handlebar templating platform

handlebars = handlebars.create({
    partialsDir: [
        'views/partials/'
    ],
    helpers: {
        split_keywords: function (keywords) { 
            if(keywords){
                var array = keywords.split(','); var links = "";
                for (var i = 0; i < array.length; i++) { 
                    if(array[i].trim() != ""){
                        links += "<a href='/search/"+array[i].trim() +"'>"+array[i].trim() +"</a>&nbsp;|&nbsp;";
                    }
                }return links.substring(0, links.length - 1);
            }else{
                return keywords;
            }
        },  
        format_amount: function (amt) {
            return numeral(amt).format('$0.00');
        }, 
        get_status_color: function (status){
            switch (status) {
                case "Completed":
                    return "success";
                    break;
                case "Shipped":
                    return "success";
                    break;
                case "Pending":
                    return "warning";
                    break;
                case "Pending - Reason: echeck":
                    return "warning";
                    break;
                default: 
                    return "danger";
                }
        },
        object_length: function(obj) {
            return Object.keys(obj).length;
        },
        checked_state: function (state) { 
            if(state == "true"){
                return "checked"
                }else{return "";
            }
        }, 
        select_state: function (state, value) { 
            if(state == value){
                return "selected"
                }else{return "";
            }
        }, 
        view_count: function (value) {
            if(value == "" || value == undefined){
                return "0";
            }else{
                return value;
            }
        },       
        format_date: function (date, format) {
            return moment(date).format(format);
        },         
        ifCond: function (v1, operator, v2, options) {
			switch (operator) {
				case '==':
					return (v1 == v2) ? options.fn(this) : options.inverse(this);
				case '!=':
					return (v1 != v2) ? options.fn(this) : options.inverse(this);
				case '===':
					return (v1 === v2) ? options.fn(this) : options.inverse(this);
				case '<':
					return (v1 < v2) ? options.fn(this) : options.inverse(this);
				case '<=':
					return (v1 <= v2) ? options.fn(this) : options.inverse(this);
				case '>':
					return (v1 > v2) ? options.fn(this) : options.inverse(this);
				case '>=':
					return (v1 >= v2) ? options.fn(this) : options.inverse(this);
				case '&&':
					return (v1 && v2) ? options.fn(this) : options.inverse(this);
				case '||':
					return (v1 || v2) ? options.fn(this) : options.inverse(this);
				default:
					return options.inverse(this);
			}
		},
        is_an_admin: function (value, options) {
            if(value == "true") {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        NotExists:function (value,options) {  
             if (typeof (value) === 'undefined'|| value==='' || value===null) {
                return options.fn(this);
            }
                return options.inverse(this);
        }
        
    }
});
// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.enable('trust proxy')
app.set('port', process.env.PORT || 5000);
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: "keyboard cat",
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10000
    },
    // store: store
}));
passport.use(new Strategy({
  clientID: '466238290387830',
  clientSecret: 'f933ed26dc436b2e3eea02f3788ce4ab',
  callbackURL: ('http://localhost:5000/auth/facebook/callback' ||'https://direktoribisnis.herokuapp.com/auth/facebook/callback')
    },
  function (accessToken, refreshToken, profile, cb) {
     localStorage.setItem('facebook_access_token', accessToken);
    return cb(null, profile);
  }));
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
var Ably = require("ably");
var realtime = new Ably.Realtime({ key: '_-wzFw.epqIdQ:s15wobsXH1aT-n1Q' });
var channel = realtime.channels.get('dirbis');
channel.publish('test',{'a':'haha'})
require('./socket')(io,channel);

app.use(passport.initialize());
app.use(passport.session());
// serving static content
app.use(express.static('public'));
// Make stuff accessible to our router
app.use(function (req, res, next) {
	req.channel=channel;
	req.markdownit = markdownit;
	req.handlebars = handlebars;
    req.bcrypt = bcrypt;
    req.products_index = products_index;
    req.orders_index = orders_index;
    req.config = config;
	next();
});
// setup the routes
app.use('/', index);
app.use('/penjual', penjual);
app.use('/protected', admin);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// lift the app
server.listen(app.get('port'), function () {
    console.log('Dirbis running on host: http://localhost:' + app.get('port'));
});



module.exports = app;
