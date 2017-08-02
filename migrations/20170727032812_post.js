exports.up = function(knex, Promise) {
   return knex.schema.createTable('post', table=>{
        table.increments('id',10).primary();
        table.string('title');
        table.string('content');
        table.string('image');
        table.string('author').references('penjual.username').onUpdate('cascade').onDelete('cascade');
        table.timestamp('created_at').defaultTo(knex.fn.now(	));
    })
  	.then(function(){
  		console.log('Table post Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('post', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
