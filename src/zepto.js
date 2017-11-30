var Zepto = (function() {
  var slice=[].slice, d=document,
    ADJ_OPS={append: 'beforeEnd', prepend: 'afterBegin', before: 'beforeBegin', after: 'afterEnd'},
    e, k, css;

  // fix for iOS 3.2
  /**
   * void 0 确保是真 undefined 值,在某些浏览器下 undefined 可以被赋值为其他
   */
  if(String.prototype.trim === void 0)
    /**
     *  ^ 匹配开头
     *  \s 匹配一个空白字符，包括空格、制表符、换页符和换行符
     *  + 匹配前面一个表达式1次或者多次。等价于 {1,}
     */
    String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') };

  function $$(el, selector){ return slice.call(el.querySelectorAll(selector)) }

  /**
   *  (|) 中间的 | 表示 或
   * ^ 已经解释过了，表示开头, \\s 其实是 \s 就是 匹配一个空白字符，包括空格、制表符、换页符和换行符。
   * 为什么会比原来的多 \, 我们可以看到在 replace 中是 //包裹的，而在下列的表达式里是由“”包裹的。
   * 在 new RegExp 中使用 \ 都需要再加一个 \ 转义，因为 \ 在字符串里面也是一个转义字符。
   *
   * 这两种创建表达式的区别：
   * 1. 前者采用正则表达式字面量的方式会在脚本加载进来之后提供编译，当正则表达式不变时，采用这种方式会比较好
   * 2. 后者通过构造函数方式进行动态生成，也就是你要解析的正则是需要通过参数传递的，这种方式的场景比较灵活，但由于
   * 每次都会新建一个构造函数实例
   *
   * // 参见： https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions
   *
   * 这个方法在 html5 中已经有 classList.contains() 了
   * // https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
   * @param {*} name
   */
  function classRE(name){ return new RegExp("(^|\\s)"+name+"(\\s|$)") }

  // 过滤假值, 在 lodash 中更加丰富,包括类型有 "" 0 undefined null
  function compact(array){ return array.filter(function(el){ return el !== void 0 && el !== null }) }

  /**
   * 下面的大致思路是：
   * 1. 创建一个函数，在这个函数的内部创建一个 fn函数，然后在fn身上挂载 N 多个方法，最后返回这个 fn 函数
   * @param {*} _
   * @param {*} context
   */
  function $(_, context){
    // 绑定 this 值
    if(context !== void 0) return $(context).find(_);
    function fn(_){ return fn.dom.forEach(_), fn }

    /**
     * 检查传入的 _ 类型，做相应的处理
     */

    fn.dom = compact((typeof _ == 'function' && 'dom' in _) ?
      _.dom : (_ instanceof Array ? _ :
        (_ instanceof Element ? [_] :
          $$(d, fn.selector = _))));

    // 使 fn 函数继承 $.fn 的各种方法
    $.extend(fn, $.fn);
    return fn;
  }

  // for in 遍历一个对象的可枚举属性，就是自身属性以及通过原型链继承的属性(__proto__)，
  // 但不包括像 Array和 Object使用内置构造函数所创建的对象都会继承自Object.prototype和String.prototype的不可枚举属性，
  $.extend = function(target, src){ for(k in src) target[k] = src[k] }


  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }

  $.fn = {
    compact: function(){ this.dom=compact(this.dom); return this },
    get: function(idx){ return idx === void 0 ? this.dom : this.dom[idx] },
    remove: function(){
      return this(function(el){ el.parentNode.removeChild(el) });
    },
    each: function(callback){ return this(callback) },
    filter: function(selector){
      return $(this.dom.filter(function(el){ return $$(el.parentNode, selector).indexOf(el)>=0; }));
    },
    first: function(callback){ this.dom=compact([this.dom[0]]); return this },
    find: function(selector){
      return $(this.dom.map(function(el){ return $$(el, selector) }).reduce(function(a,b){ return a.concat(b) }, []));
    },
    closest: function(selector){
      var el = this.dom[0].parentNode, nodes = $$(d, selector);
      while(el && nodes.indexOf(el)<0) el = el.parentNode;
      return $(el && !(el===d) ? el : []);
    },
    pluck: function(property){ return this.dom.map(function(el){ return el[property] }) },
    show: function(){ return this.css('display', 'block') },
    hide: function(){ return this.css('display', 'none') },
    prev: function(){ return $(this.pluck('previousElementSibling')) },
    next: function(){ return $(this.pluck('nextElementSibling')) },
    html: function(html){
      return html === void 0 ? (this.dom.length>0 ? this.dom[0].innerHTML : null) : this(function(el){ el.innerHTML = html });
    },
    attr: function(name,value){
      return (typeof name == 'string' && value === void 0) ? (this.dom.length>0 ? this.dom[0].getAttribute(name) || undefined : null) :
        this(function(el){
          if (typeof name == 'object') for(k in name) el.setAttribute(k, name[k])
          else el.setAttribute(name,value);
        });
    },
    offset: function(){
      var obj = this.dom[0].getBoundingClientRect();
      return { left: obj.left+d.body.scrollLeft, top: obj.top+d.body.scrollTop, width: obj.width, height: obj.height };
    },
    css: function(prop, value){
      if(value === void 0 && typeof prop == 'string') return this.dom[0].style[camelize(prop)];
      css=""; for(k in prop) css += k+':'+prop[k]+';';
      if(typeof prop == 'string') css = prop+":"+value;
      return this(function(el) { el.style.cssText += ';' + css });
    },
    index: function(el){
      return this.dom.indexOf($(el).get(0));
    },
    bind: function(event, callback){
      return this(function(el){
        event.split(/\s/).forEach(function(event){ el.addEventListener(event, callback, false); });
      });
    },
    delegate: function(selector, event, callback){
      return this(function(el){
        el.addEventListener(event, function(event){
          var target = event.target, nodes = $$(el, selector);
          while(target && nodes.indexOf(target)<0) target = target.parentNode;
          if(target && !(target===el) && !(target===d)) callback(target, event);
        }, false);
      });
    },
    live: function(event, callback){
      $(d.body).delegate(this.selector, event, callback); return this;
    },
    hasClass: function(name){
      return classRE(name).test(this.dom[0].className);
    },
    addClass: function(name){
      return this(function(el){ !$(el).hasClass(name) && (el.className += (el.className ? ' ' : '') + name) });
    },
    removeClass: function(name){
      return this(function(el){ el.className = el.className.replace(classRE(name), ' ').trim() });
    },
    trigger: function(event){
      return this(function(el){ var e; el.dispatchEvent(e = d.createEvent('Events'), e.initEvent(event, true, false)) });
    }
  };

  ['width','height'].forEach(function(m){ $.fn[m] = function(){ return this.offset()[m] }});

  for(k in ADJ_OPS)
    $.fn[k] = (function(op){
      return function(html){ return this(function(el){
        el['insertAdjacent' + (html instanceof Element ? 'Element' : 'HTML')](op,html)
      })};
    })(ADJ_OPS[k]);

  return $;
})();

'$' in window||(window.$=Zepto);
