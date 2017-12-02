//--------先看第一行以及最后一行-----------//
/**
 * 首先整体采用匿名函数包裹的自执行方式，这样的方法的好处就是利用函数作用域的特性，不会让函数内部使用的变量污染到函数外部
 * CopyZepto 就是 函数执行的结果，return 了 X。所以 CopyZepto 就是 X
 * 最后我们将X 赋值给 window对象，以供全局调用
 */

var CopyZepto = (function(){
  // 可以理解为 X 就是 $
  function X(dom,context) {
    console.log('dom node',dom, 'context', context)
  }
  X.ok = 'ok'
  return X
})()

'X' in window || (window.X = CopyZepto)

/**
 * 照着以上方式，我们可以调用 X.ok 方法了。所以我们很多方法就可以在X下面注册
 * 那么如何实现链式调用呢？ 比如 X('span').css('color:red').show()
 *
 * 首先作者在内部创建了  fn 函数，这个函数就是 $() 调用的返回值
 * 然后通过 extends 方法，让$.fn里所有的方法都挂载到 fn函数上，fn也拥有相同方法了。
 *  所以其实 $("a")  就是在调用 fn("a")
 * $("a").get() 就是在调用 fn("a").get()
 * 好，注意以下关键点
 * 如果一个函数中有this，这个函数有被上一级的对象所调用，那么this指向的就是上一级的对象。
 */

  /**
   * this test
   */
//  X = {
//   get: function() {return this.a},
//   a: 'I am fn a '
//  }
// 所以 this 就指向这个 fn 函数了

/**
 * 那么又是如何支持链式调用的呢？
 * 仔细看 fn(_) 这个函数，结尾返回了 fn 自己。而 fn本身就挂载了超级多的方法，当然可以继续调用啦
 * 你可以理解为最后又返回了 this
 */



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

  // 利用 通过call来改变this的指向，也就是说 slice会对 call里面传入的参数进行调用, 确保其转成数组
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
    /**
     * 在 zepto 的用法中，
     * $('span', $('p'))    // same
     * $('p').find('span')  // same
     *
     * 所以会用到 find
     */
    if(context !== void 0) return $(context).find(_);
    // $.fn 中的 this 指向的是 这个函数
    // 逗号表达式，前面执行完了，返回的是后面的值。
    // 当你想要在期望一个表达式的位置包含多个表达式时，可以使用逗号操作, 作者应该是出于简洁考虑吧

    /**
     * 作者写的有点绕
     * 我们可以看到 $.fn下面有一些列 this(func)的调用，其实就是调用 fn(_)
     * 那么this 是如何指向 fn的 ?
     * 首先 fn 通过 extends 直接获得了各种方法
     */
    function fn(_){ return fn.dom.forEach(_), fn }

    /**
     * 检查传入的 _ 类型，做相应的处理
     * 如果传入的是一个数组那 fn.dom 就是这个数组
     * 如果传入的是一个 Element,那么还是把它转换成数组
     * 如果不是 element 那么就通过 $$ 选择器去找到 相应的元素，注意 $$ 即 document.querySelector 返回的也是数组，每项都是 DOM节点
     */
    fn.dom = compact(
      (typeof _ == 'function' && 'dom' in _) ?  _.dom
        : (_ instanceof Array ? _ : (_ instanceof Element ? [_]
          : $$(d, fn.selector = _)))
      );

    // 使 fn 函数继承 $.fn 的各种方法
    $.extend(fn, $.fn);
    return fn;

    // 所以 $ 调用的是 fn
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

    /**
     * nodes 表示所有和  selector相同的一个数组
     * this.dom[0] 表示的是你传入的DOM的第一个数， 因为是 通过 document.querySelectorAll(dom) 去取的，所以[0] 是默认第一个
     */
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
    // 绑定多个事件,其实就是将字符串分割数组后依次注册事件
    bind: function(event, callback){
      return this(function(el){
        // event.split(' ').forEach(function(event){el.addEventListener(event ,callback, false)})
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
