exports.up = function(knex, Promise) {
   return knex.schema.createTable('admin_account', table=>{
        table.increments('id');
		table.string('username').unique();
		table.string('email');
        table.string('fullname');
        table.string('password');
		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.timestamp('updated_at').defaultTo(knex.fn.now());
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('admin_account', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
