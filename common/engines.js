/**
 * 获取模板渲染引擎
 */

var util = require( 'util' );
var fs = require( 'fs' );

/**
 * velocity的模板引擎
 * @type {exports.Engine|*}
 */
var velocityEngine = require( 'velocity' ).Engine;

/**
 * django的模板引擎
 */
var djangoEngine = require( 'django' );

/**
 * smarty的模板引擎
 */
var smartyEngine = require( 'nsmarty' );

/**
 * freemarker模板引擎
 * @type {exports}
 */
var freemarkerEngine = require( 'freemarker.js' );

module.exports = {

    /**
     * 获取渲染引擎
     * @param tplFile
     * @param config
     */
    getEngine : function ( tplFile, config ) {

        var tplFileOld = tplFile;
        var useTemp = false;
        if ( config.wsBeforeReplace && config.wsBeforeReplace.html ) {
            tplFile = tplFile + '.tmp';
            var fileConOld = fs.readFileSync( tplFileOld).toString();
            var fileConNew = fileConOld;
            for ( var i = 0, len = config.wsBeforeReplace.html.length;
                i < len; i ++ ) {
                fileConNew = fileConNew.replace(
                    config.wsBeforeReplace.html[ i ].pattern,
                    config.wsBeforeReplace.html[ i ].replace
                );
            }
            fs.writeFileSync( tplFile, fileConNew );
            useTemp = true;
        }

        /**
         * 每一个engine必须要留有一个render方法
         * @type {{velocity: velocityEngine}}
         */
        var engines = {

            // velocity
            velocity: {
                /**
                 * 自定义的render方法
                 * @param context
                 */
                render: function ( context, callback ) {
                    try {
                        var renderer = new velocityEngine( {
                            root: config.templates,
                            template: tplFile,
                            cache: false
                        } );
                        callback( renderer.render( context ) );
                    }
                    catch( e ) {

                    }
                    finally {
                        useTemp && fs.unlinkSync( tplFile );
                    }

                }
            },

            // django
            django: {
                /**
                 * 自定义的render方法
                 * @param context
                 */
                render: function ( context, callback ) {

                    try {
                        djangoEngine.configure( {
                            template_dirs: config.templates
                        } );
                        return djangoEngine
                            .renderFile( tplFile, context, function ( err, out ) {
                                if ( err )
                                    throw err;
                                callback( out );
                                useTemp && fs.unlinkSync( tplFile );
                            } );
                    }
                    catch( e ) {
                        useTemp && fs.unlinkSync( tplFile );
                    }
                    finally { }

                }
            },

            smarty: {
                render: function ( context, callback ) {

                    try {
                        // 特殊处理
                        if ( config.templates.lastIndexOf( '/' )
                            != config.templates.length - 1 ) {
                            config.templates += '/';
                        }
                        smartyEngine.tpl_path = config.templates;
                        smartyEngine.clearCache();

                        var readable = smartyEngine.assign( tplFile, context );
                        var out = '';
                        readable.on( 'data', function( chunk ) {
                            if ( !chunk )
                                return;
                            out += chunk.toString();
                        } );
                        readable.on( 'end', function() {
                            callback( out );
                            useTemp && fs.unlinkSync( tplFile );
                        } );
                    }
                    catch( e ) {
                        useTemp && fs.unlinkSync( tplFile );
                    }
                    finally {

                    }

                }
            },

            freemarker: {
                render: function ( context, callback ) {

                    try {
                        var fm = new freemarkerEngine( {
                            viewRoot: config.templates,
                            // 查看这里：http://fmpp.sourceforge.net/settings.html#sect6
                            options: {
                                sourceEncoding: 'UTF-8',
                                outputEncoding: 'UTF-8'
                                /** for fmpp */
                            }
                        } );

                        // freemarker会自动拼接viewRoot和tplFile。。
                        tplFile = tplFile.replace( config.templates, '' );

                        fm.render( tplFile, JSON.stringify( context ), function(err, html, output) {
                            if ( err ) {
                                throw err;
                            }
                            callback( html );
                            useTemp && fs.unlinkSync( tplFile );
                        } );
                    }
                    catch( e ) {
                        useTemp && fs.unlinkSync( tplFile );
                    }
                    finally {

                    }

                }
            }

        };

        return engines[ config.tplEngine || 'velocity' ];

    }

};
