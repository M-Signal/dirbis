

exports.up = function(knex, Promise) {
   return knex.schema.createTable('order_details', table=>{
        table.increments('id');
        table.integer('order_id').notNullable().references('orders.id').onDelete('cascade').onUpdate('cascade');
        table.string('product_by').notNullable().references('users.username').onDelete('cascade').onUpdate('cascade');
        table.integer('product_id').notNullable().references('products.id').onDelete('cascade').onUpdate('cascade');
        table.string('product_name');
        table.integer('qty');   
        table.integer('price');
        table.text('status');
		table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
       
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('order_details', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
