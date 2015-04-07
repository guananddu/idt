/**
 * webserver
 */

var shell = require( 'shelljs' );
var path = require( 'path' );
var fs = require( 'fs' );
var dir = process.cwd();
var idtconfig = require( '../../config' );

var utils = require( '../../common/utils' );

var configFile;
var config;

var enableWeinreDebug;
var weinreDebugPort;
var weinreDebugHost;

/**
 * 启动服务器
 * @return {[type]} [description]
 */
var startWs = function() {

    // config = require( path.join( dir, configFile ) );

    // start
    var comm = [

        'require( \'grunt\' ) --gruntfile "',
        path.join( __dirname, '../../', idtconfig.wsName ),
        '" --configpath "',
        path.join( dir, configFile ),
        '" --wsweinredebug ',
        enableWeinreDebug,
        ' --weinredebugport ',
        weinreDebugPort,
        ' --weinredebughost ',
        weinreDebugHost,

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    /*
    // 这是以前的调用grunt的方法，抛弃之，改为代码直接运行形式的
    shell.exec( comm, function( code, output ) {
        utils.clog.nor( 'Exit code: ' + utils.errorMaps[ code ] );
        // console.log( 'Program output:', output );
    } );
    */

    // 直接require grunt
    var g = require( 'grunt' );
    // ws 模式下只有一个默认的任务
    g.cli.tasks = [ 'default' ];
    // 配置选项
    g.cli.options.gruntfile = path.join( __dirname, '../../', idtconfig.wsName );
    g.cli.options.configpath = path.join( dir, configFile );
    g.cli.options.wsweinredebug = enableWeinreDebug;
    g.cli.options.weinredebugport = weinreDebugPort;
    g.cli.options.weinredebughost = weinreDebugHost;
    // 运行grunt
    g.cli();

};

var ceIdtConfig = function () {

    require( './ceconfig' )( 'main', startWs );

};

module.exports = function( action, options ) {

    var program = this;
    configFile = program.config;
    utils.clog.cmd( 'running idt ws(webserver) ' 
        + action + ', use ' + configFile );

    enableWeinreDebug = options.remote;
    weinreDebugPort = options.portfordebug;
    weinreDebugHost = options.hostfordebug;

    switch ( action ) {

        // start the webserver
        case 'start':
            fs.exists( path.join( dir, configFile ), function( exists ) {
                exists ? startWs() : ceIdtConfig();
            } );
            break;

        default:

            break;

    }

};
