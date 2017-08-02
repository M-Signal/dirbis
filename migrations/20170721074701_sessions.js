

exports.up = function(knex, Promise) {
   return knex.schema.createTable('sessions', table=>{
       table.string('sid').primary();
		table.timestamp('expired');
		table.json('sess');
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('sessions', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
