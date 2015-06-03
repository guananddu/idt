IDTC【去掉了c/c++ addon的依赖】
===

Integration Develop Tool【去掉了c/c++ addon的依赖】

适用于Django Template、PHP Smarty、Java Velocity、Java Freemarker的Integration Develop Tool [ 集成开发工具 ]

### 安装

##### windows下，为了保持统一，请下载
[git bash](http://msysgit.github.io/)

##### windows下，如果想解决`git bash`下的中文乱码问题，请看[这里](http://www.cnblogs.com/wangkongming/p/3821305.html)

#### 下面的步骤mac和windows一致

##### 请确保已经安装好[nodejs](http://nodejs.org/)

##### 使用`npm install`来安装idtc

	(sudo) npm install -g idtc

##### 成功以后可以开始使用

    idtc -h

    Usage: idtc [options] [command]

    Commands:

      ws <action>  run webserver: `idt ws start`. <action> now only has `start` option
      build        build your project
      ceconfig     create `idt-config` for your project

    Options:

      -h, --help             output usage information
      -V, --version          output the version number
      -c, --config [config]  specify your `idt-config.js`, `idt-config.js` by default

> 在windows下如果出现npm安装相关的错误，则可能是没有在`c:\Users\xxx\AppData\Roaming`下建立`npm`文件夹；

##### 开发，进入到项目根目录

	idtc ceconfig
	
此命令，将会在当前`pwd`的目录，新建一个名为`idt-config.js`的idt配置文件，在此配置文件中，可配置`webserver`相关参数及其`build`的相关参数。这一步其实可以省略了，在运行`ws start`的时候，会自动检测配置文件有没有生成。

##### 本地静态服务器

	idtc ws start
	
此命令，会把当前`pwd`的目录作为根目录，启动根据`idt-config.js`中配置的`webserver`服务器，以便开发。

##### 部署

	idtc build

> `idt-config.js`文件可以通过`idt ws start`来自动生成，`module.conf`则需要仔细阅读生成的`idt-config.js`文件中的说明及其配置。

`idtc build`默认是不压缩的build过程，这是为了便于开发、联调。发布线上之前需要带上`--release`参数：

	idtc build --release
	
`idtc build`同样可以针对某个子目录进行build：

	idtc build template/example admin/js (--release)
	
> 配置文件`idt-config.js`一定要仔细查看及配置