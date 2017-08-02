exports.up = function(knex, Promise) {
   return knex.schema.createTable('penjual', table=>{
       table.increments();
       table.string('username').unique().references('users.username').onUpdate('cascade').onDelete('cascade');;
       table.boolean('gender');
       table.string('photo');
       table.string('address');
       table.string('province');
       table.string('city');
       table.string('district');
       table.string('postal_code');
       table.string('sub_district');
       table.string('phone');
       table.string('company_name');
       table.text('company_desc');
       table.string('account_number');
       table.string('bank_name');
       table.string('bank_branch');
       table.string('account_name');
       
    })
  	.then(function(){
          
  	});
};
 
exports.down = function(knex, Promise) {
  return knex.schema
  	.dropTable('penjual', table=>{
		    
	  })
  	.then(function (){
  	});
};
