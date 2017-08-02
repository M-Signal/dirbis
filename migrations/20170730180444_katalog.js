

exports.up = function(knex, Promise) {
   return knex.schema.createTable('katalog', table=>{
        table.increments('id');
        table.string('title');
        table.text('desc');
        table.string('file');
        table.string('upload_by').notNullable().references('penjual.username').onDelete('cascade').onUpdate('cascade');
        table.string('product_permalink').unique();
		table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
       
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('katalog', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
