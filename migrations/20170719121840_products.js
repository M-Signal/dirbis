
exports.up = function(knex, Promise) {
   return knex.schema.createTable('products', table=>{
		table.increments('id');
		table.string('product_permalink').unique();
		table.string('product_title');
        table.integer('product_price');
        table.string('product_description');
        table.boolean('product_published');
        table.string('product_featured');
        table.date('product_added_date');
		table.string('product_image');
		table.string('product_by').references('users.username').onDelete('cascade').onUpdate('cascade');
		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.timestamp('updated_at').defaultTo(knex.fn.now());
      
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('products', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};

