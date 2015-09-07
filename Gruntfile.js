module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        beautify: {
          beautify: true,
          indent_level: 0
        },
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */'
      },
      dist: {
        files: [{
          expand: true,
          cwd: './src',
          src: '**/*.js',
          dest: 'build'
        }]
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },
    nodeunit: {
      all: ['./test/**/*.test.js'],
      options: {
        reporterOptions: {
          output: 'docs'
        }
      }
    },
    jsdoc: {
      dist: {
        src: ['src/**/*.js', 'test/**/*.js'],
        options: {
          destination: 'docs/jsdoc'
        }
      }
    },
    copy: {
      pack: {
        files: [
          {expand: true, src: ['./.npmignore'], dest: './build'},
          {expand: true, src: ['./package.json'], dest: './build'}
        ]
      }
    },
    compress: {
      main: {
        options: {
          mode: 'zip',
          archive: '<%= pkg.name %>-<%= pkg.version %>.zip'
        },
        files: [{ expand: true, src: '**', cwd: './build' }]
      }
    },
    clean: ["./build", "./docs", "./*.zip"]
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-contrib-nodeunit");
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('build', ['jshint', 'nodeunit', 'uglify', 'copy:pack']);
  grunt.registerTask('pack', ['clean', 'build', 'compress']);
  grunt.registerTask('default', ['build', 'jsdoc']);
};
