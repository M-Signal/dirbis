exports.up = function(knex, Promise) {
   return knex.schema.createTable('facebook_account', table=>{
	   table.increments();
       table.string('username').unique().notNullable().references('users.username');
       table.string('facebook_id').notNullable();
       table.timestamps();
    })
  	.then(function(){
          
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('facebook_account', table=>{
		    
	  })
  	.then(function (){
  	});
};
