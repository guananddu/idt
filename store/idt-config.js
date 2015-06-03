/**
 * idt配置文件
 */

var path = require( 'path' );

// 当前文件夹路径【无需修改】
var webContent = __dirname;

// web inspector remote 的配置及其使用参看：【!!!idtc下不能使用!!!】
// http://people.apache.org/~pmuellr/weinre-docs/latest/Running.html
// debug username, 关闭调试: `off`，如果设置此项，则开启调试，不设置即为`off`关闭
var wsWeinreDebug = '' || 'off';
// default 8080
var weinreDebugPort = '' || '8080'; 
// default localhost 
var weinreDebugHost = '' || 'localhost'; 

// 执行`build`的时候字符串替换的配置
// 【此项视情况而定】
var replaces = {
    exclude: [ '*' ],
    include: [ '*.html' ],
    replacements: [
        // { from: /\#parse\( \"/g, to: '#parse( "tpl/' },
        /**
         * html中build之后需要忽略的代码段，请使用：
         * <!-- idt-build-ignore-start -->
         * <!-- idt-build-ignore-end -->
         * 进行包裹
         */
        { from: /<!--\s*idt-build-ignore-start\s*-->(.|[\r\n\t])*?<!--\s*idt-build-ignore-end\s*-->/g, to: '' }
     ]
};

// 二级目录设置【一般不需修改】
var secondary = '';
// build子目录时需要用到【无需修改】
var buildLevel = '';

module.exports = {

    // webserver的端口号
    webPort: '8003',

    // webserver的项目根目录【一般不需修改】，即为当前`pwd`的目录
    webContent: webContent,

    // 模板引擎根目录【只需要修改最后一个参数即可】
    templates: path.join( webContent, secondary, '.' ),

    // 模板引擎切换: smarty / django / velocity / freemarker [ 默认velocity ]
    /**
     * velocity模板引擎采用：
     * https://www.npmjs.com/package/velocity
     *
     * django模板引擎采用'A wrapper of Django's template engine'方式（桥接原理）
     * 详见：https://www.npmjs.com/package/django
     * 在启用之前请确保python环境已经ready，然后安装django:
     * # pip install -v Django==1.7
     * //or
     * # easy_install "Django==1.7"
     *
     * smarty模板引擎采用：
     * https://www.npmjs.com/package/nsmarty
     *
     * freemarker模板引擎采用：（桥接原理）
     * 在启用之前，请确保java环境，并且需要安装：http://fmpp.sourceforge.net/
     * https://www.npmjs.com/package/freemarker.js#readme
     */
    tplEngine: 'django',

    // 反向代理配置【按需配置】，键名可以随意，只要是每一个的匹配规则
    reverseProxyMap: {

        tpl: {
            pattern: /^\/custom\//,
            replace: '/tpl/custom/'
        }

    },

    // webserver响应前的替换规则，键名指派了要替换的类型
    // wsBeforeReplace: {

    //     html: [
    //         {
    //             pattern: /template\//g,
    //             replace: ''
    //         }
    //     ]

    // },

    // 单路径整体build【String】
    // buildPath: '../outs/outall',

    // 多路径整体build【Array】
    // buildPath: [ '../outs/o1', '../outs/o2' ],

    // 多路径整体build，但是需要资源分离【Object】
    buildPath: {

        // 键名是需要存留的文件，键值是对应的build路径

        '.js': '../outs/outjs',
        '.css': '../outs/outcss',
        '.jpg|.jpeg|.gif|.png': '../outs/outimg',
        '.html|.htm': '../outs/outtemplate',

        // template的buildpath直接诶通过templates路径指定

    },

    // 批处理按照对应的模板文件，生成相同模板，不同静态页面的配置
    batch2Html: {

        // 指定数据源目录
        path: path.join( webContent, 'mock/batch' ),

        // 指定静态文件输出目录
        out: path.join( webContent, 'mock/batch_out' ),

        // 模板路径在上面配置的`template`路径下
        tpl: '404.html',

        // 数据的data路径是自动生成
        // 在 path.join( 'mock/batch', tpl[ 上面的tpl路径去掉.html的文件夹 ] )

    },

    // 是否对'*.atpl.js'这种请求进行判断【一般不需修改】
    // false: 读取'*.atpl'
    // true: 读取'*.atpl.js'
    wsNoNeed2TrimDotJs: false,

    // mock 相关配置【一般不需修改】
    mockCommon: 'commonmock/common.js', // 此项会拼接下面的两个前缀路径
    mockTemplate: path.join( webContent, secondary, 'mock/html' ),
    mockAjax: path.join( webContent, secondary, 'mock/ajax' ),

    /**
     * web server 中间层
     * requester 是一个请求器，可以用来做反向代理等等
     * 
     * @param  {Object} connect
     * @param  {Object} options
     * @param  {Array}  middlewares 系统中间层
     * @param  {Object} rtool       
     * { 
     *     requester: 请求器, 
     *     defaulthostp: '默认的本地域名' 
     * }
     * @return {Array}  中间层数组
     */
    middlewares: function( connect, options, middlewares, rtool ) {

        // how to inject a custom middleware into the array of default 
        // middlewares
        // 
        // html middlewares example:
        // 
        // middlewares.unshift( function( req, res, next ) {
        //     if ( utils.isHtml( req ) )
        //         return handlerHtml.run( req, res, next, config );
        //     return next();
        // } );

        middlewares.unshift( function( req, res, next ) {
            // 这是一个可以自定义的中间层
            console.log( 'user middleware, request url: ' + req.url );
            return next();
        } );

        // 如果需要请求对应的线上数据或者其他域的数据，可以使用 requester 来请求
        // requester的使用参见：
        // https://www.npmjs.org/package/request
        // console.log( rtool.requester, rtool.defaulthostp );

        return middlewares;

    },

    wsWeinreDebug: wsWeinreDebug,
    weinreDebugPort: weinreDebugPort,
    weinreDebugHost: weinreDebugHost,

    // 【无需修改】
    input: path.resolve( webContent, buildLevel ),
    // 【无需修改】
    output: path.resolve( __dirname, '.output', buildLevel ),
    // 【无需修改】
    replaces: replaces,

    // build 处理器配置
    getProcessors: function() {
        var lessProcessor = new LessCompiler( {
            // 【此项先不做配置了】
            // 
            // 在build的时候，没有必要对每一个less都进行编译，因为很可能有一些被import
            // 入的less文件会编译出错【不会影响整体样式】，只需在include中写入每一个页面的
            // 入口main.less文件即可
            // 
            // exclude: [ '*.less' ],
            // include: [ 
            //     'src/center/mine/css/mine.less',
            //     'src/custom/search/css/search.less'
            //  ]
        } );
        var cssProcessor = new CssCompressor( {
            compressOptions: {
                keepBreaks: false
            }
        } );
        var html2JsCompilerProcessor = new Html2JsCompiler( {
            mode: 'compress',
            extnames: [ 'atpl' ],
            combine: true,
            exclude: [ '*' ],
            include: [ '*.atpl' ]
        } ); 
        var moduleProcessor = new ModuleCompiler();
        var jsProcessor = new JsCompressor();
        var pathMapperProcessor = new PathMapper();
        var addCopyright = new AddCopyright();
        var stringReplace = new StringReplace( replaces );

        return {
            // 默认的build不需要压缩，以便开发（联调）的时候，利于调试
            'default': [ lessProcessor, html2JsCompilerProcessor,
                        moduleProcessor, pathMapperProcessor, 
                        stringReplace ],
            // 在最后联调成功以后，要进行release，会进行代码压缩等处理
            'release': [
                lessProcessor, cssProcessor, html2JsCompilerProcessor,
                moduleProcessor,jsProcessor, pathMapperProcessor, 
                addCopyright, stringReplace
            ]
        };
    },

    // build 中需要排除的文件（夹）
    exclude: [
        'demo',
        'Gruntfile.js',
        'tests',
        'test',
        'examples',
        'vendor',
        'demo',
        'tool',
        'doc',
        'test',
        'make',
        'module.conf',
        'dep/packages.manifest',
        'dep/*/*/test',
        'dep/*/*/doc',
        'dep/*/*/demo',
        'dep/*/*/tool',
        'dep/*/*/*.md',
        'dep/*/*/package.json',
        'edp-*',
        '.edpproj',
        '.svn',
        '.git',
        '.gitignore',
        '.idea',
        '.project',
        'Desktop.ini',
        'Thumbs.db',
        '.DS_Store',
        '*.tmp',
        '*.bak',
        '*.swp',
        '*.psd',
        'copyright.txt',
        'package.json',
        'README.md',
        'mobile',
        'idt-config.js',
        'idt-config.js.bak',
        // pagefooter.html为建立下载模板，build会出错，故排除，但是需要单独处理
        'pagefooter.html',
        'WEB-INF',
        'mock'
    ],

    // 和上面的保持一致就可以，idt单独对其进行copy
    idtCopyList: [],

    // do not modify
    injectProcessor: function( processors ) {
        for ( var key in processors ) {
            global[ key ] = processors[ key ];
        }
    }

};

/**
 * 在项目根目录执行build，需要在根目录建立一个`module.conf`文件
 * 它是用来配置module模块，如下内容的文件：
 *   {
 *       "baseUrl": "src",
 *       "packages": [ ],
 *       "combine": {
 *           "abc/def/main": 1
 *       }
 *   }
 */