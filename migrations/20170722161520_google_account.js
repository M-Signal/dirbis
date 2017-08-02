exports.up = function(knex, Promise) {
   return knex.schema.createTable('google_account', table=>{
	   table.increments();
       table.string('username').unique().notNullable().references('users.username');
       table.string('google_id').notNullable();
			  table.timestamps();
    })
  	.then(function(){
          
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('google_account', table=>{
		    
	  })
  	.then(function (){
  	});
};
