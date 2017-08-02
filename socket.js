var requestify=require('requestify');
module.exports=function(io,channel){
    io.on('connection',function(socket){
//   console.log('connected');
  
  channel.subscribe('post',function(message) {
  });
  socket.on('posting-timeline',function(){
      socket.emit('update-timeline');
  })
  socket.emit('news',{data:'herris'});
});

io.on('disconnect', function () {
  console.log('disconnect');
  
});

}