exports.up = function(knex, Promise) {
   return knex.schema.createTable('user_account', table=>{
       table.increments();
       table.string('username').unique().notNullable().references('users.username').onUpdate('cascade').onDelete('cascade');
       table.string('password');
       table.string('confirm_token');
       table.boolean('confirmation');
       table.timestamps();
    })
  	.then(function(){
          
  	});
};

exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('user_account', table=>{
		    
	  })
  	.then(function (){
  	});
};
