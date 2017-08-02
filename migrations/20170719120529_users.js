exports.up = function(knex, Promise) {
   return knex.schema.createTable('users', table=>{
        table.increments('id');
		table.string('username').unique();
		table.string('email');
		table.string('fullname');
		table.timestamp('created_at').defaultTo(knex.fn.now(	));
		table.timestamp('updated_at').defaultTo(knex.fn.now());
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('users', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
