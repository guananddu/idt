/**
 * build
 */

var shell = require( 'shelljs' );
var utils = require( '../../common/utils' );
var path = require( 'path' );
var idtconfig = require( '../../config' );
var runner = require( '../runner/main' );

var fs = require( 'fs' );
var mkdirp = require( 'mkdirp' );
var _ = require( 'underscore' );

// 当前操作路径
var currentDir = process.cwd();

// 用户配置
var userConfig;
// 用户传参
var userBuilds;
// 是否release
var isRelease;
var isDebugRemote;

var isMultiple;

// 只能先这样寻找edp
var edpPath = path.resolve( __dirname, '../../', 'node_modules', 'edp/bin/edp-cli' );

// 针对子文件夹的build
var buildMulti = function() {

    isMultiple = true;

    userBuilds.forEach( function( item, index ) {

        var target = path.join( currentDir, item );
        if ( !fs.existsSync( target ) ) {
            utils.clog.error( 'do not exists: ' + target );
            return false;
        }
        buildItem( target, item );

    } );

    // 从.output中copy至目标路径
    copyAssets();

    isRelease && compressHtmlForItem();

    // deleteAssets();

    deleteTemp();

    // clearAfter();
    
    afterBuild();

};

var deleteTemp = function() {

    var comm = [

        'rm -f "',
        path.join( currentDir, idtconfig.tempConfig ),
        '"'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

    userBuilds.forEach( function( item, index ) {

        var targetPath = utils.getPathDir( path.join( currentDir, item ) );
        if ( !~targetPath.lastIndexOf( path.basename( item ) ) ) {
            item = path.dirname( item );
        }
        item = utils.src2asset( item );
        deleteSingleModuleConf( item );

    } );

};

var deleteSingleModuleConf = function( item ) {

    if ( itemHasModuleConfig[ item ] )
        return;

    var comm = [

        'rm -f "',
        path.join( currentDir, item, idtconfig.moduleConfig ),
        '"'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

};

var runBuildItem = function( targetPath, item ) {

    var comm = [

        'node ',
        edpPath,
        ' build ',
        '--config=.idt-config ',
        '--stage=',
        isRelease ? 'release' : 'default',
        ' -f'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

    // if ( isRelease 
    //     && item.indexOf( path.basename( userConfig.templates ) ) == 0 ) {
    //     // 需要压缩html
    //     compressHtmlForItem( targetPath, item );
    // }

};

var compressHtmlForItemRunner = function ( item, targetPath ) {

    if ( !targetPath ) {

        _.each( userConfig.buildPath, function ( value, key ) {
            compressHtmlForItemRunner( item, value );
        } );

        return;

    }

    runner.htmlmin( 
        path.join( targetPath, item, '/' ), 
        path.join( userConfig.output, item ) );

};

var compressHtmlForItem = function() {

    userBuilds.forEach( function( item, index ) {
        var targetPath = utils.getPathDir( path.join( currentDir, item ) );
        if ( !~targetPath.lastIndexOf( path.basename( item ) ) ) {
            item = path.dirname( item );
        }

        item = utils.src2asset( item );
        compressHtmlForItemRunner( item );

    } );

};

/**
 * 用来判断针对某个子文件夹构建的时候，是否存在`module.conf`文件
 * @type {Object}
 */
var itemHasModuleConfig = { };

var buildItem = function( target, item ) {

    var targetPath = utils.getPathDir( target );

    if ( !~targetPath.lastIndexOf( path.basename( item ) ) ) {
        item = path.dirname( item );
    }

    // 检查是否有`module.config`
    var module = path.join( targetPath, idtconfig.moduleConfig );
    if ( !fs.existsSync( module ) ) {
        itemHasModuleConfig[ item ] = false;
        fs.writeFileSync( module, JSON.stringify( idtconfig.moduleExample ) );
    }
    else {
        itemHasModuleConfig[ item ] = true;
    }

    // 生成动态idt-config，修改现有路径
    fs.writeFileSync( path.join( currentDir, idtconfig.tempConfig ),
        fs.readFileSync( path.join( currentDir, idtconfig.configName ), {
            encoding: 'utf-8'
        } )
        .replace( /buildLevel = \'\'/, 'buildLevel = \'' + item + '\'' ) );

    // 命令要使用同步模式
    runBuildItem( targetPath, item );

    // 针对item的build如果一级目录有`src`，需要替换成`asset`
    item.indexOf( 'src' ) == 0
        && runner.mvsrc( 
            path.resolve( userConfig.output ) );

};

var runCopy = function( fileName ) {

    var comm = [

        'cp -f "',
        path.join( currentDir, fileName ),
        '" "',
        path.join( userConfig.output, path.dirname( fileName ) ),
        '"'

    ].join( '' );

    comm = utils.handleWinCp( comm );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

};

var copyAssets = function( targetPath ) {

    // 一个可递归的函数
    if ( !targetPath ) {

        // 第一次调用需要循环
        _.each( userConfig.buildPath, function ( value, key ) {
            copyAssets( value );
            // !( parseInt( key ) == key )
            //     && runner.sp( value, key )
            //     && runner.reempty( value );
        } )

        return;
    }

    // 检查目标路径
    !fs.existsSync( targetPath ) && mkdirp.sync( targetPath );

    var comm = [

        'cp -rf ',
        path.join( userConfig.output, '/*' ),
        ' "',
        path.join( targetPath ),
        '"'

    ].join( '' );

    comm = utils.handleWinCp( comm );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

    // deleteAssets();

};

var deleteAssets = function() {

    var comm = [

        'rm -rf "',
        path.join( userConfig.output ),
        '"'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

};

var compressHtml = function( targetPath ) {

    if ( !targetPath ) {

        _.each( userConfig.buildPath, function ( path, key ) {

            compressHtml( path );

        } );

        return;

    }

    runner.htmlmin( 
        targetPath, 
        path.join( userConfig.output ) );

};

var buildRootCopy = function() {

    var targets = userConfig.idtCopyList;
    targets.forEach( function( item, index ) {
        runCopy( item );
    } );

    // 从.output中copy至目标路径
    copyAssets();

    // 压缩html
    if ( isRelease ) {
        compressHtml();
        afterBuild();
        return;
    }

    afterBuild();

};

// 对根目录的build
var buildRoot = function( configfile ) {

    isMultiple = false;

    // root的build需要自己先写好idt-config.js文件
    var comm = [

        'node ',
        edpPath,
        ' build ',
        configfile ? ( '--config=' + configfile + ' ' ) : '--config=idt-config.js ',
        '--stage=',
        isRelease ? 'release' : 'default',
        ' -f'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, function( code, output ) {
        utils.clog.nor( 'Exit code: ' + utils.errorMaps[ code ] );
        // console.log( 'Program output:', output );
        // copy something
        buildRootCopy();
        // del configfile
        configfile && delConfigfile( configfile );
    } );

    /* edp 异步
    var edp = require( 'edp/lib/cli' );
    // 拼凑参数
    var args = [
        undefined,
        undefined,
        'build',
        configfile ? ( '--config=' + configfile + ' ' ) : '--config=idt-config.js',
        '--stage=' + ( isRelease ? 'release' : 'default' ),
        '-f'
    ];

    edp.parse( null, args );

    // copy something
    buildRootCopy();
    // del configfile
    configfile && delConfigfile( configfile );
    */

};

function delConfigfile( file ) {

    var comm = [

        'rm -f "',
        file,
        '"'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

}

function buildForDebug( program ) {

    // userConfig.replaces.replacements.push( {
    //     from: /\<\/body\>/,
    //     to: '<script class="jsdom" src="http://' 
    //         + userConfig.weinreDebugHost + ':'
    //         + userConfig.weinreDebugPort + '/target/target-script-min.js#'
    //         + userConfig.wsWeinreDebug + '"></script></body>'
    // } );

    var from = '/\\<\\/body\\>/';
    var to = '<script class="jsdom" src="http://' 
        + userConfig.weinreDebugHost + ':' 
        + userConfig.weinreDebugPort + '/target/target-script-min.js#' 
        + userConfig.wsWeinreDebug + '"></script></body>';

    var filepath = path.resolve( currentDir, program.config );
    var newfilepath = path.resolve( currentDir, '.idt-config.js' );
    var filecontent = fs.readFileSync( filepath );
    fs.writeFileSync( newfilepath,
        filecontent
        .toString()
        .replace( /replacements:\s+\[(.*)\]/, 'replacements:[$1' + ',' +
            '{from:' + from + ',to:\'' + to + '\'}' + ']' ) );

    buildRoot( '.idt-config.js' );

}

function clearAfter () {

    var comm = [

        'find . -name "*.atpl.js" | xargs rm'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

    clearAfterTarget();

}

function clearAfterTarget( targetPath ) {

    if ( !targetPath ) {

        _.each( userConfig.buildPath, function ( tpath, key ) {
            // 如果是针对子目录的构建
            if ( isMultiple ) {
                userBuilds.forEach( function( item, index ) {
                    var targetPath = utils.getPathDir( path.join( currentDir, item ) );
                    if ( !~targetPath.lastIndexOf( path.basename( item ) ) ) {
                        item = path.dirname( item );
                    }
                    item = utils.src2asset( item );
                    var ntpath = path.join( tpath, item );
                    clearAfterTarget( ntpath );
                    !( parseInt( key ) == key )
                        && runner.sp( ntpath, key )
                        && runner.reempty( ntpath );
                } );
            }
            else {
                // 针对单个项目的构建
                clearAfterTarget( tpath );
                !( parseInt( key ) == key )
                    && runner.sp( tpath, key )
                    && runner.reempty( tpath );
            }
        } );

        return;
    }

    var comm = [

        'find "',
        targetPath,
        '" -name "*.less" | xargs rm'

    ].join( '' );

    utils.clog.cmd( 'running ' + comm );

    shell.exec( comm, {
        async: false
    } );

}

function afterBuild () {

    deleteAssets();
    clearAfter();

}

module.exports = function( dirs, options ) {
    var program = this;
    utils.clog.cmd( 'running idt build, use ' + program.config );

    userConfig = require( path.resolve( currentDir, program.config ) );
    userBuilds = dirs;
    isRelease = options.release;
    isDebugRemote = options.debugremote;

    // 对buildpath做处理，统一作为Array/Object处理
    typeof( userConfig.buildPath ) == 'string'
        && ( userConfig.buildPath = [ userConfig.buildPath ] );

    // 判断是不是需要对远程调试进行build
    if ( userConfig.wsWeinreDebug != 'off' && isDebugRemote ) {
        return buildForDebug( program );
    }

    // 如果没有附带参数，则从当前目录开始构建
    dirs.length ? buildMulti() : buildRoot();

    // 清理
    // clearAfter();
    
    // 应该把命令执行都写成同步模式

};
