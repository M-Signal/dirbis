

exports.up = function(knex, Promise) {
   return knex.schema.createTable('orders', table=>{
        table.increments('id');
        table.integer('order_total')
		table.string('order_email');
        table.string('order_firstname');
        table.string('order_lastname');
        table.string('order_addr1');
        table.string('order_addr2');
        table.string('order_country');
        table.string('order_state');
        table.string('order_postcode');
        table.string('order_status');
        table.string('order_date');
        table.boolean('order_verification');
        table.string('order_attachment');
        table.boolean('purchase');
        table.string('order_by').notNullable().references('users.username').onDelete('cascade').onUpdate('cascade');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
       
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('orders', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
