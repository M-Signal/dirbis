
var knex = require('../knexfile'),
    config=require('knex')(knex.development),
	bookshelf = require('bookshelf')(config);
    
module.exports={
    users : bookshelf.Model.extend({
        tableName: 'users',
    }),
    products : bookshelf.Model.extend({
        tableName: 'products',
    }),
    orders:bookshelf.Model.extend({
        tableName: 'orders',
    }),
    facebook_account:bookshelf.Model.extend({
        tableName: 'facebook_account',
    }),
    penjual:bookshelf.Model.extend({
        tableName: 'penjual',
    })
    ,
    pembeli:bookshelf.Model.extend({
        tableName: 'pembeli',
    }),
    user_account:bookshelf.Model.extend({
        tableName: 'user_account',
    }),
    permintaan:bookshelf.Model.extend({
        tableName: 'permintaan',
    })
    ,
    admin_account:bookshelf.Model.extend({
        tableName: 'admin_account',
    }),
    post:bookshelf.Model.extend({
        tableName: 'post',
    }),
    shipping:bookshelf.Model.extend({
        tableName: 'shipping',
    }),
    order_details:bookshelf.Model.extend({
        tableName: 'order_details',
    }),
     likes:bookshelf.Model.extend({
        tableName: 'likes',
    })
}
