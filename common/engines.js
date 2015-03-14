/**
 * 获取模板渲染引擎
 */

var util = require( 'util' );

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
                    var renderer = new velocityEngine( {
                        root: config.templates,
                        template: tplFile,
                        cache: false
                    } );
                    callback( renderer.render( context ) );
                }
            },

            // django
            django: {
                /**
                 * 自定义的render方法
                 * @param context
                 */
                render: function ( context, callback ) {

                    djangoEngine.configure( {
                        template_dirs: config.templates
                    } );
                    return djangoEngine
                        .renderFile( tplFile, context, function ( err, out ) {
                            if ( err )
                                throw err;
                            callback( out );
                        } );
                }
            },

            smarty: {
                render: function ( context, callback ) {

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
                    } );

                }
            },

            freemarker: {
                render: function ( context, callback ) {

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
                    } );

                }
            }

        };

        return engines[ config.tplEngine || 'velocity' ];

    }

};
