var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var fs = require('fs');
var MarkdownIt = require('markdown-it');
var md = new MarkdownIt({
  html:true,
  langPrefix:'code-'
});

module.exports = function(dir){
  dir = dir || '.';
  //初始化 express
  var app = express();
  var router = express.Router();
  app.use('/assets',serveStatic(path.resolve(dir,'assets')));
  app.use(router);

  //渲染文章
  router.get('/posts/*',function(req,res,next){
    //res.end(req.params[0]);
    var name = stripExtname(req.params[0]);
    var file = path.resolve(dir,'_post',name + '.md');
    fs.readFile(file,function(err,content){
      if(err) return next(err);

      var post = parseSourceContent(content.toString());
      post.content = markdownToHTML(post.source);
      post.layout = post.layout || 'post';
      var html = renderFile(path.resolve(dir,'_layout',post.layout+'.html'),{post:post})

      res.end(html);
    });
  });

  //渲染列表
  router.get('/',function(req,res,next){
    res.end('文章列表');
  });

  app.listen(3000);

};

//去掉文件名中的拓展名
function stripExtname(name){
  var i = 0 - path.extname(name).length;
  if(i === 0) i = name.length;
  return name.slice(0,i);
}

//强Markdown 转换为HTML
function markdownToHTML(content){
  return md.render(content || '');
}

//解析文章内容
function parseSourceContent(data){
  var split = '---';
  var i = data.indexOf(split);
  var info = {};
  if(i !== -1){
    var j = data.indexOf(split,i + split.length);
    if(j !== -1){
      var str = data.slice(i + split.length,j).trim();
      console.log('===============================');
      console.log(str);
      data = data.slice(j + split.length);
      str.split('\n').forEach(function(line){
        var i = line.indexOf(':');
        if(i !== -1){
          var name = line.slice(0,i).trim();
          var value = line.slice(i + 1).trim();
          info[name] = value;
        }
      });
    }
  }
  info.source = data;
  console.log(data);
  return info;
}

//增加模板
var swig = require('swig');
swig.setDefaults({cache:false});

//渲染模板
function renderFile(file,data){
  return swig.render(fs.readFileSync(file).toString(),{
    filename:file,
    autoescape:false,
    locals:data
  });
}
