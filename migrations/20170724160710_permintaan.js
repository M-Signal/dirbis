exports.up = function(knex, Promise) {
   return knex.schema.createTable('permintaan', table=>{
       table.increments();
       table.string('name');
       table.integer('kuantitas');
       table.string('satuan');
       table.integer('harga');
       table.text('desc');
       table.string('province');
       table.string('city');
       table.string('address');
       table.string('create_by').references('users.username').onUpdate('cascade').onDelete('cascade');
       
    })
  	.then(function(){
          
  	});
};
 
exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('permintaan', table=>{
		    
	  })
  	.then(function (){
  	});
};
