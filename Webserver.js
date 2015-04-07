/**
 * Webserver任务
 * @author pooky
 */

var fs = require( 'fs' );
var path = require( 'path' );

var requester = require( 'request' );

var idtconfig = require( './config' );
var utils = require( './common/utils' );

//var beforeMw = require( './handler/ws/beforemw' );

var handlerHtml = require( './handler/ws/html' );
var handlerAjax = require( './handler/ws/ajax' );
var handlerLess = require( './handler/ws/less' );
var handlerAtpl = require( './handler/ws/atpl' );
var handlerRProxy = require( './handler/ws/reverse' );

var config;

var wsweinredebug;

/**
 * onCreateServer
 * @param  {Object} server  [description]
 * @param  {Object} connect [description]
 * @param  {Object} options [description]
 */
var onCreateServer = function( server, connect, options ) {

    debugger;
    utils.clog.nor( 'WebServer Pid: ' + process.pid );
    utils.clog.nor( 'Running on port: ' + options.port );

    // socket 支持
    var io = require( 'socket.io' ).listen( server );
    io.sockets.on( 'connection', function( socket ) {

        // do something with socket

    } );

    // write stop 
    // kill -9 $pid
    // var kill = 'kill -9 ' + process.pid;
    // kill += '\necho "Stop Webserver successful!"';
    // fs.writeFile( 'stop', kill, function( err ) {
    //     if ( err ) throw err;
    //     console.log( 'Pid\'s saved!' );
    // } );

};

/**
 * 中间层
 * @type {Array}
 */
// var middleWares = [

//     // 处理html的中间层
//     function html( req, res, next ) {
//         if ( utils.isHtml( req ) )
//             return handlerHtml.run( req, res, next );
//         return next();
//     }

// ];

/**
 * 中间层【建议的中间层写法】
 * @param  {[type]} connect     [description]
 * @param  {[type]} options     [description]
 * @param  {[type]} middlewares [description]
 * @return {[type]}             [description]
 */
var middleWares = function( connect, options, middlewares ) {

    // inject a custom middleware into the array of default middlewares
    // html
    middlewares.unshift( function( req, res, next ) {
        if ( utils.isHtml( req ) )
            return handlerHtml.run( req, res, next, config );
        return next();
    } );

    // ajax
    middlewares.unshift( function( req, res, next ) {
        if ( utils.isAjax( req ) )
            return handlerAjax.run( req, res, next, config );
        return next();
    } );

    // less
    middlewares.unshift( function( req, res, next ) {
        if ( utils.isLess( req ) )
            return handlerLess.run( req, res, next, config );
        return next();
    } );

    // atpl
    middlewares.unshift( function( req, res, next ) {
        if ( utils.isAtpl( req ) )
            return handlerAtpl.run( req, res, next, config );
        return next();
    } );

    // static
    // middlewares.unshift( function( req, res, next ) {
    //     connect.static( options.base );
    // } );

    // directory
    // middlewares.unshift( function( req, res, next ) {
    //     connect.directory( options.base );
    // } );

    return middlewares;

};

var reverseProxyLayer = function( req, res, next ) {
    var matcherKey;
    if ( matcherKey = utils.matchRProxy( req, config.reverseProxyMap ) )
        return handlerRProxy.run( req, res, next, config, matcherKey );
    return next();
};

module.exports = function( grunt ) {

    var webconfigpath = grunt.option( 'configpath' );
    config = require( webconfigpath );

    // 以配置文件为准，如果需要build出来的话，也是需要的
    config.wsweinredebug = config.wsWeinreDebug || grunt.option( 'wsweinredebug' );
    config.weinredebugport = config.weinreDebugPort || grunt.option( 'weinredebugport' );
    config.weinredebughost = config.weinreDebugHost || grunt.option( 'weinredebughost' );

    // Project configuration.
    grunt.initConfig( {

        pkg: grunt.file.readJSON( './package.json' ),

        /**
         * 服务器配置
         * @type {Object}
         */
        connect: {
            // base server
            baseServer: {
                options: {
                    port: config.webPort,
                    // 可访问性
                    hostname: '*',
                    // 根目录
                    base: config.webContent,
                    // 持续任务
                    keepalive: true,
                    onCreateServer: onCreateServer,
                    // 中间层
                    middleware: function ( connect, options, middlewares ) {
                        // 系统默认中间层
                        var sysMids = middleWares( connect, options, middlewares );
                        // 用户可能也会有自定义的过滤器
                        var concatedMids = config.middlewares 
                            && config.middlewares( connect, options, sysMids, 
                                {
                                    requester: requester,
                                    defaulthostp: 'http://localhost:' + config.webPort
                                } )
                            || sysMids;
                        // 反向代理的中间层要放到第一个
                        concatedMids.unshift( reverseProxyLayer );
                        return concatedMids;
                    }
                }
            }
        }

    } );

    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks( 'grunt-contrib-connect' );

    // 默认被执行的任务列表。
    grunt.registerTask( 'default', [ 'connect' ] );

};
