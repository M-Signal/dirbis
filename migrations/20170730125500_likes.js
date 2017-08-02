

exports.up = function(knex, Promise) {
   return knex.schema.createTable('likes', table=>{
        table.increments('id');
        table.integer('post_id').notNullable().references('post.id').onDelete('cascade').onUpdate('cascade');
        table.string('user_like').notNullable().references('users.username').onDelete('cascade').onUpdate('cascade');
		table.unique(['post_id','user_like']);
		table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
       
   })
  	.then(function(){
  		console.log('Table Pengguna Berhasil ditambahkan!');
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('likes', table=>{
	  })
  	.then(function (){
  		console.log('Table Pengguna Berhasil dihapus!');
  	});
};
