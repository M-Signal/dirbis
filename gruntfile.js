var path =require('path');
module.exports = function(grunt) {
    grunt.initConfig({
        
        pkg : grunt.file.readJSON('package.json'),
       
        jshint : {
            myFiles : ['./app.js','./routes/**/*.js']
        },
        nodemon : {
            script : './app.js'
        },
        watch:{
             express: {
                dev: {
                    options: {
                        port: 3000,
                        bases: ['/public'],
                        keepalive: true,
                        server: path.resolve('./app.js')
                    }
                }
            },
        },
      
        html_reorderify: {
        reorder: {
            options: {
                first: ['id', 'class', 'style'],
                last: [],
            },
            files: [
                {
                expand: true,
                cwd: 'Views',
                src: ['**/*.html'],
                dest: '/Views',
                ext: '.html',
                },
                ],
            },
        },
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.registerTask('default', ['jshint','nodemon']);
   
};
    