module.exports = function ( grunt )
{
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-html2js');

  /**
   * This is the configuration object Grunt uses to give each plugin its
   * instructions.
   */
  var taskConfig = {
    /**
     * We read in our `package.json` file so we can access the package name and
     * version. It's already there, so we don't repeat ourselves here.
     */
    pkg: grunt.file.readJSON("package.json"),

    /**
     * The `build_dir` folder is where our projects are compiled during
     * development and the `compile_dir` folder is where our app resides once it's
     * completely built.
     */
    build_dir: 'build',
    compile_dir: 'bin',

    /**
     * This is a collection of file patterns that refer to our app code (the
     * stuff in `src/`). These file paths are used in the configuration of
     * build tasks. `js` is all project javascript, less tests. `ctpl` contains
     * our reusable components' (`src/common`) template HTML files, while
     * `atpl` contains the same, but for our app's code. `html` is just our
     * main HTML file, `less` is our main stylesheet, and `unit` contains our
     * app's unit tests.
     */
    app_files: {
      js: [ 'src/**/*.js', '!src/**/*.spec.js' ],
      jsunit: [ 'src/**/*.spec.js' ],

      coffee: [ 'src/**/*.coffee', '!src/**/*.spec.coffee' ],
      coffeeunit: [ 'src/**/*.spec.coffee' ],

      atpl: [ 'src/app/**/*.tpl.html' ],
      ctpl: [ 'src/common/**/*.tpl.html' ],

      html: [ 'src/index.html' ],
      less: 'src/less/main.less',

      jade: [ 'src/**/*.jade']
    },

    /**
     * This is the same as `app_files`, except it contains patterns that
     * reference vendor code (`vendor/`) that we need to place into the build
     * process somewhere. While the `app_files` property ensures all
     * standardized files are collected for compilation, it is the user's job
     * to ensure non-standardized (i.e. vendor-related) files are handled
     * appropriately in `vendor_files.js`.
     *
     * The `vendor_files.js` property holds files to be automatically
     * concatenated and minified with our project source files.
     *
     * The `vendor_files.css` property holds any CSS files to be automatically
     * included in our app.
     */
    vendor_files: {
      js: [
        'vendor/angular/angular.js',
        'vendor/angular-resource/angular-resource.js',
        'vendor/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'vendor/placeholders/angular-placeholders-0.0.1-SNAPSHOT.min.js',
        'vendor/angular-ui-router/release/angular-ui-router.js',
        'vendor/angular-ui-utils/modules/route/route.js',
        'vendor/underscore/underscore.js'
      ],
      css: [
      ]
    },

    /**
     * The banner is the comment that is placed at the top of our compiled
     * source files. It is first processed as a Grunt template, where the `<%=`
     * pairs are evaluated based on this very configuration object.
     */
    meta: {
      banner:
          '/**\n' +
              ' * <%= pkg.name %> - v<%= pkg.version %>\n' +
              ' * <%= pkg.homepage %>\n' +
              ' *\n' +
              ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
              ' */\n'
    },

    /**
     * The directories to delete when `grunt clean` is executed.
     */
    clean: [
      '<%= build_dir %>',
      '<%= compile_dir %>'
    ],

    /**
     * The `copy` task just copies files from A to B. We use it here to copy
     * our project assets (images, fonts, etc.) and javascripts into
     * `build_dir`, and then to copy the assets to `compile_dir`.
     */
    copy: {
      build_assets: {
        files: [{
          src: [ '**' ],
          dest: '<%= build_dir %>/assets/',
          cwd: 'src/assets',
          expand: true
        }]
      },
      build_appjs: {
        files: [{
          src: [ '<%= app_files.js %>' ],
          dest: '<%= build_dir %>/',
          cwd: '.',
          expand: true
        }]
      },
      build_vendorjs: {
        files: [{
          src: [ '<%= vendor_files.js %>' ],
          dest: '<%= build_dir %>/',
          cwd: '.',
          expand: true
        }]
      },
      compile_assets: {
        files: [{
          src: [ '**' ],
          dest: '<%= compile_dir %>/assets',
          cwd: '<%= build_dir %>/assets',
          expand: true
        }]
      },
      lib: {
        files: [{
          src: 'ripple.js',
          dest: '<%= build_dir %>',
          cwd: '.',
          expand: true
        }]
      }
    },

    /**
     * `grunt concat` concatenates multiple source files into a single file.
     */
    concat: {
      /**
       * The `compile_js` target is the concatenation of our application source
       * code and all specified vendor source code into a single file.
       */
      compile_js: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [
          '<%= vendor_files.js %>',
          'module.prefix',
          '<%= build_dir %>/src/**/*.js',
          '<%= html2js.app.dest %>',
          '<%= html2js.common.dest %>',
          '<%= html2js.jade_app.dest %>',
          '<%= html2js.jade_common.dest %>',
          '<%= vendor_files.js %>',
          'module.suffix'
        ],
        dest: '<%= compile_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },

    /**
     * `grunt-contrib-jade` compiles jade files to html and puts them in build_dir
     */
    jade: {
      compile: {
        files: [
          {
            src: [ '<%= app_files.jade %>' ],
            cwd: '.',
            dest: '<%= build_dir %>',
            expand: true,
            ext: '.html'
          }
        ]
      }
    },

    /**
     * `grunt coffee` compiles the CoffeeScript sources. To work well with the
     * rest of the build, we have a separate compilation task for sources and
     * specs so they can go to different places. For example, we need the
     * sources to live with the rest of the copied JavaScript so we can include
     * it in the final build, but we don't want to include our specs there.
     */
    coffee: {
      source: {
        options: {
          bare: true
        },
        expand: true,
        cwd: '.',
        src: [ '<%= app_files.coffee %>' ],
        dest: '<%= build_dir %>',
        ext: '.js'
      }
    },

    /**
     * `ng-min` annotates the sources before minifying. That is, it allows us
     * to code without the array syntax.
     */
    ngmin: {
      compile: {
        files: [
          {
            src: [ '<%= app_files.js %>' ],
            cwd: '<%= build_dir %>',
            dest: '<%= build_dir %>',
            expand: true
          }
        ]
      }
    },

    /**
     * Minify the sources!
     */
    uglify: {
      compile: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          '<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
        }
      }
    },

    webpack: {
      name: {
        // webpack options
        entry: "./src/app/app.js",
        output: {
          path: "./build/src/",
//          filename: "[hash].js"
          filename: "xrpvalue.js"
        },
        jshint: {
          "validthis": true,
          "laxcomma" : true,
          "laxbreak" : true,
          "browser"  : true,
          "eqnull"   : true,
          "debug"    : true,
          "devel"    : true,
          "boss"     : true,
          "expr"     : true,
          "asi"      : true,
          "sub"      : true
        },
        stats: {
          // Configure the console output
          colors: false,
          modules: true,
          reasons: true
        },

        storeStatsTo: "xyz",
        failOnError: false
      }
    },

    /**
     * `recess` handles our LESS compilation and uglification automatically.
     * Only our `main.less` file is included in compilation; all other files
     * must be imported from this file.
     */
    recess: {
      build: {
        src: [ '<%= app_files.less %>' ],
        dest: '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css',
        options: {
          compile: true,
          compress: false,
          noUnderscores: false,
          noIDs: false,
          zeroUnits: false
        }
      },
      compile: {
        src: [ '<%= recess.build.dest %>' ],
        dest: '<%= recess.build.dest %>',
        options: {
          compile: true,
          compress: true,
          noUnderscores: false,
          noIDs: false,
          zeroUnits: false
        }
      }
    },

    /**
     * `jshint` defines the rules of our linter as well as which files we
     * should check. This file, all javascript sources, and all our unit tests
     * are linted based on the policies listed in `options`. But we can also
     * specify exclusionary patterns by prefixing them with an exclamation
     * point (!); this is useful when code comes from a third party but is
     * nonetheless inside `src/`.
     */
    jshint: {
      src: [
        '<%= app_files.js %>'
      ],
      test: [
        '<%= app_files.jsunit %>'
      ],
      gruntfile: [
        'Gruntfile.js'
      ],
      options: {
        "validthis": true,
        "laxcomma" : true,
        "laxbreak" : true,
        "browser"  : true,
        "eqnull"   : true,
        "debug"    : true,
        "devel"    : true,
        "boss"     : true,
        "expr"     : true,
        "asi"      : true,
        "sub"      : true
      },
      globals: {}
    },

    /**
     * `coffeelint` does the same as `jshint`, but for CoffeeScript.
     * CoffeeScript is not the default in ngBoilerplate, so we're just using
     * the defaults here.
     */
    coffeelint: {
      src: {
        files: {
          src: [ '<%= app_files.coffee %>' ]
        }
      },
      test: {
        files: {
          src: [ '<%= app_files.coffeeunit %>' ]
        }
      }
    },

    /**
     * HTML2JS is a Grunt plugin that takes all of your template files and
     * places them into JavaScript files as strings that are added to
     * AngularJS's template cache. This means that the templates too become
     * part of the initial payload as one JavaScript file. Neat!
     */
    html2js: {
      /**
       * These are the templates from `src/app`.
       */
      app: {
        options: {
          base: 'src/app'
        },
        src: [ '<%= app_files.atpl %>' ],
        dest: '<%= build_dir %>/templates-app.js'
      },

      /**
       * These are the templates from `src/common`.
       */
      common: {
        options: {
          base: 'src/common'
        },
        src: [ '<%= app_files.ctpl %>' ],
        dest: '<%= build_dir %>/templates-common.js'
      },

      /**
       * These are the jade files from `src/app`.
       */
      jade_app: {
        options: {
          base: 'build/src/app'
        },
        src: [ 'build/src/app/**/*.html' ],
        dest: '<%= build_dir %>/templates-jade-app.js'
      },

      /**
       * These are the jade files from `src/common`.
       */
      jade_common: {
        options: {
          base: 'build/src/common'
        },
        src: [ 'build/src/common/**/*.html' ],
        dest: '<%= build_dir %>/templates-jade-common.js'
      }

    },

    /**
     * The `index` task compiles the `index.html` file as a Grunt template. CSS
     * and JS files co-exist here but they get split apart later.
     */
    index: {

      /**
       * During development, we don't want to have wait for compilation,
       * concatenation, minification, etc. So to avoid these steps, we simply
       * add all script files directly to the `<head>` of `index.html`. The
       * `src` property contains the list of included files.
       */
      build: {
        dir: '<%= build_dir %>',
        src: [
          '<%= vendor_files.js %>',
          '<%= build_dir %>/src/**/*.js',
          '<%= html2js.common.dest %>',
          '<%= html2js.app.dest %>',
          '<%= html2js.jade_app.dest %>',
          '<%= html2js.jade_common.dest %>',
          '<%= vendor_files.css %>',
          '<%= recess.build.dest %>'
        ]
      },

      /**
       * When it is time to have a completely compiled application, we can
       * alter the above to include only a single JavaScript and a single CSS
       * file. Now we're back!
       */
      compile: {
        dir: '<%= compile_dir %>',
        src: [
          '<%= concat.compile_js.dest %>',
          '<%= vendor_files.css %>',
          '<%= recess.compile.dest %>'
        ]
      }
    },

    /**
     * And for rapid development, we have a watch set up that checks to see if
     * any of the files listed below change, and then to execute the listed
     * tasks when they do. This just saves us from having to type "grunt" into
     * the command-line every time we want to see what we're working on; we can
     * instead just leave "grunt watch" running in a background terminal. Set it
     * and forget it, as Ron Popeil used to tell us.
     *
     * But we don't need the same thing to happen for all the files.
     */
    delta: {
      /**
       * By default, we want the Live Reload to work for all tasks; this is
       * overridden in some tasks (like this file) where browser resources are
       * unaffected. It runs by default on port 35729, which your browser
       * plugin should auto-detect.
       */
      options: {
        livereload: true
      },

      /**
       * When the Gruntfile changes, we just want to lint it. In fact, when
       * your Gruntfile changes, it will automatically be reloaded!
       */
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: [ 'jshint:gruntfile' ],
        options: {
          livereload: false
        }
      },

      /**
       * When our JavaScript source files change, we want to run lint them and
       * run our unit tests.
       */
      jssrc: {
        files: [
          '<%= app_files.js %>'
        ],
        tasks: [ 'jshint:src', 'copy:build_appjs', 'webpack' ]
      },

      /**
       * When our CoffeeScript source files change, we want to run lint them and
       * run our unit tests.
       */
      coffeesrc: {
        files: [
          '<%= app_files.coffee %>'
        ],
        tasks: [ 'coffeelint:src', 'coffee:source', 'copy:build_appjs' ]
      },

      /**
       * When assets are changed, copy them. Note that this will *not* copy new
       * files, so this is probably not very useful.
       */
      assets: {
        files: [
          'src/assets/**/*'
        ],
        tasks: [ 'copy:build_assets' ]
      },

      /**
       * When index.html changes, we need to compile it.
       */
      html: {
        files: [ '<%= app_files.html %>' ],
        tasks: [ 'index:build' ]
      },

      /**
       * When our templates change, we only rewrite the template cache.
       */
      tpls: {
        files: [
          '<%= app_files.atpl %>',
          '<%= app_files.ctpl %>'
        ],
        tasks: [ 'html2js' ]
      },

      jadesrc: {
        files: [
          '<%= app_files.jade %>'
        ],
        tasks: [ 'jade', 'html2js' ]
      },

      /**
       * When the CSS files change, we need to compile and minify them.
       */
      less: {
        files: [ 'src/**/*.less' ],
        tasks: [ 'recess:build' ]
      },

      /**
       * When a JavaScript unit test file changes, we only want to lint it and
       * run the unit tests. We don't want to do any live reloading.
       */
      jsunit: {
        files: [
          '<%= app_files.jsunit %>'
        ],
        tasks: [ 'jshint:test' ],
        options: {
          livereload: false
        }
      },

      /**
       * When a CoffeeScript unit test file changes, we only want to lint it and
       * run the unit tests. We don't want to do any live reloading.
       */
      coffeeunit: {
        files: [
          '<%= app_files.coffeeunit %>'
        ],
        tasks: [ 'coffeelint:test' ],
        options: {
          livereload: false
        }
      }
    }
  };

  grunt.initConfig( taskConfig );

  /**
   * In order to make it safe to just compile or copy *only* what was changed,
   * we need to ensure we are starting from a clean, fresh build. So we rename
   * the `watch` task to `delta` (that's why the configuration var above is
   * `delta`) and then add a new task called `watch` that does a clean build
   * before watching for changes.
   */
  grunt.renameTask( 'watch', 'delta' );
  grunt.registerTask( 'watch', [ 'build', 'delta' ] );

  /**
   * The default task is to build and compile.
   */
  grunt.registerTask( 'default', [ 'build', 'compile' ] );

  /**
   * The `build` task gets your app ready to run for development and testing.
   */
  grunt.registerTask( 'build', [
    'clean', 'jshint', 'coffeelint', 'coffee', 'jade', 'html2js', 'recess:build',
    'copy:build_assets', 'copy:build_appjs', 'copy:build_vendorjs', 'copy:lib',
    'index:build', 'webpack'
  ]);

  /**
   * The `compile` task gets your app ready for deployment by concatenating and
   * minifying your code.
   */
  grunt.registerTask( 'compile', [
    'recess:compile', 'copy:compile_assets', 'ngmin', 'concat', 'uglify', 'index:compile'
  ]);

  /**
   * A utility function to get all app JavaScript sources.
   */
  function filterForJS ( files ) {
    return files.filter( function ( file ) {
      return file.match( /\.js$/ );
    });
  }

  /**
   * A utility function to get all app CSS sources.
   */
  function filterForCSS ( files ) {
    return files.filter( function ( file ) {
      return file.match( /\.css$/ );
    });
  }

  /**
   * The index.html template includes the stylesheet and javascript sources
   * based on dynamic names calculated in this Gruntfile. This task assembles
   * the list into variables for the template to use and then runs the
   * compilation.
   */
  grunt.registerMultiTask( 'index', 'Process index.html template', function () {
    var dirRE = new RegExp( '^('+grunt.config('build_dir')+'|'+grunt.config('compile_dir')+')\/', 'g' );
    var jsFiles = filterForJS( this.filesSrc ).map( function ( file ) {
      return file.replace( dirRE, '' );
    });
    var cssFiles = filterForCSS( this.filesSrc ).map( function ( file ) {
      return file.replace( dirRE, '' );
    });

    grunt.file.copy('src/index.html', this.data.dir + '/index.html', {
      process: function ( contents, path ) {
        return grunt.template.process( contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config( 'pkg.version' )
          }
        });
      }
    });
  });

};