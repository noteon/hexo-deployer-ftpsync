var ftp = require( 'vinyl-ftp' );
var fs = require( 'vinyl-fs' );
var path=require('path');

hexo.extend.deployer.register('vftpsync', function(args, callback){
  if (!args.host || !args.user || args.pass == null){
    var help = [
      'You should argsure deployment settings in _config.yml first!',
      '',
      'Example:',
      '  deploy:',
      '    type: vftpsync',
      '    host: <host>',
      '    port: [port] # Default is 21',
      '    remote: [remote] # Default is `/`',
      '    user: <user>',
      '    pass: <pass>',
      '    ignore: [ignore]',
      '    parallel: [parallel] # Default is 3',
      '    maxConnections: [maxConnections] # Default is 1',
      '',
      'For more help, you can check the docs: ' + 'http://hexo.io/docs/deployment.html'.underline
    ];

    console.log(help.join('\n'));
    return callback();
  }

  var conn = ftp.create({
    host: args.host,
    port: args.port || 21,
    user: args.user,
    password: args.pass,
    parallel: args.parallel || 3,
    maxConnections: args.maxConnections || args.connections || 1,
    debug: (str)=>{
      if (str.indexOf("[connection] > 'MKD")>-1 || str.indexOf("[connection] > 'STOR")>-1){
        console.log(str);
      }
    },
    // local: hexo.public_dir,
    // host: args.host,
    ignore: args.ignore || []

  });

  var local_dir=path.relative(process.cwd(), hexo.public_dir);
  var globs = [
    local_dir+"/**",
  ];  

   var remote= args.remote || '/';

//step2: upload local dir to ftp site
  fs.src( globs, { buffer: false } )
    .on('error', callback)
    .on('finish', ()=>console.log("Ftp operation begin, newer comparing...","localDir",local_dir))
    .pipe( conn.newerOrDifferentSize(remote) ) // only upload newer files
    .on('error', callback)
    .on('finish', ()=> console.log("Ftp Newer Comparing Finish,  transferring..."))
    .pipe( conn.dest(remote ))
    .on('error', callback)
    .on('finish', callback)
});
