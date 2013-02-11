
json_parse = (function() {

  // Token
  var T_STRING = "T0:STR" ,   // string
  T_COLON = "T1::",       // :
  T_COMMA = "T2:,",       // ,
  T_TRUE = "T3:TRUE",        // true
  T_FALSE = "T4:FALSE",       // false
  T_NULL = "T5:NULL",        // null
  T_LBRACKET = "T6:{",    // {
  T_RBRACKET = "T7:}",    // }
  T_LSQRBRACKET = "T8:[", // [
  T_RSQRBRACKET = "T9:]", // ]
  T_NUMBER = "T10:NUM",   // number
  // Node
  N_OBJ = "N0",        // object
  N_OBJ_ATTR = "N1",   // {key, value} pair in  object
  N_ARRAY = "N2",      // array
  N_LITERAL = "N3",    // Boolean, .. in syntax tree

  tokenize = (function(){
    var tokens = [], source, cur_idx, buf = [],

    next = function (i){
      //      i = typeof i !== "undefined" ? i : 1;
      cur_idx+=i || 1;
    },
    error = function(msg) {
      throw new Error('Invalid token:'+msg);
    },
    cur_char = function(i){
      i = i || 0;
      return source.charAt(cur_idx+i);
    },
    check_literal = function(literal){
      var result = true;
      for(var i=0, length=literal.length; i<length && result; i+=1) {
	if (literal.charAt(i)!==cur_char(i)) result=false;
      }
      return result;
    },

    make_string = function(){
      next(); // skip first quote
      var buf="", charCode=0, decimal=0;
      while(cur_char()!=="\"") {

	if (cur_idx > source.length-1) error("Broken format("+source+")");
	if (cur_char()==="\b" || cur_char()==="\f" || cur_char()==="\n" || cur_char()==="\r" || cur_char()==="\t") error("Control character included.");

	if (cur_char()==="\\") {
	  // \ escaped value
	  switch (cur_char(1)) {
	    // Add unescaped character
	    case "\"": case "/": case "\\":
	      buf+=cur_char(1);
	      next(2);
	      break;
	    // Add control character
	    case "b":
	      buf+="\b";
	      next(2);
	      break;
	    case "f": 
	      buf+="\f";
	      next(2);
	      break;
	    case "n":
	      buf+="\n";
	      next(2);
	      break;
	    case "r":
	      buf+="\r";
	      next(2);
	      break;
	    case "t":
	      buf+="\t";
	      next(2);
	      break;
	    // unicode escape sequence
	    case "u":
	      charCode=0;
	      next(2);    // skip '\u'
	      for(var i=0; i<4; i+=1) {
		// Get decimal from hex
		decimal = parseInt(cur_char(), 16);
		if (!isFinite(decimal)) error("Invalid hex("+cur_char()+")");
		charCode = charCode * 16 + decimal;
		next();
	      }
	      buf += String.fromCharCode(charCode);
	      break;
	    default:
	      error("unexpected escape (\\"+cur_char()+")");
	      break;
	  }
	} else {
	  // Not \ escaped value
	  buf+=cur_char();
	  next();
	}
      }
      next(); // skip close "
      return make_token(T_STRING, buf);
    },
    make_number = function(){
      var buf="", is_frac=false, is_float=false;
      if (cur_char() === "-") {
	buf+="-";
	next();
      }
      if (cur_char()==0 ) {
	if (cur_char(1) !== ".") error("0 heading number.");
	// decimal fraction less than 1
	buf += cur_char()+".";
	is_frac = true;
	next(2);
      }
      while((cur_char()>=0 && cur_char()<=9)) {
	// todo: prevent infinite loop.
	buf += cur_char();
	next();
	if (cur_char()===".") {
	  if (is_frac) error("Doubled decimal point.");
	  if (is_float) error("After float char 'E'.");
	  // decimal fraction
	  is_frac = true;
	  buf += cur_char();
	  next();
	}
	if (cur_char()==="e" || cur_char()==="E") {
	  // float
	  if ( cur_char(-1)<0 || cur_char(-1)>9 ) error("broken float.");
	  if ( is_float ) error("Doubled float char 'E'.");
	  is_float = true;
	  buf += cur_char();
	  next();
	  if (cur_char()==="+" || cur_char()==="-") {
	    buf += cur_char();
	    next();
	  }
	}
      }
      return make_token(T_NUMBER, buf);
    },

    make_token = function(type, value) {
      return {
	type: type,
	value: value
      };
    };
    
    return function(str) {

      source = str, cur_idx=0, tokens=[],
      c = cur_char();

      while (cur_idx<source.length) {
	switch (c) {
	  case "{":
	    tokens.push(make_token(T_LBRACKET));
	    next();
	    break;	    
	  case "}":
	    tokens.push(make_token(T_RBRACKET));
	    next();
	    break;
	  case "[":
	    tokens.push(make_token(T_LSQRBRACKET));
	    next();
	    break;	    
	  case "]":
	    tokens.push(make_token(T_RSQRBRACKET));
	    next();
	    break;
          case ":":
	    tokens.push(make_token(T_COLON));
	    next();
	    break;
	  case ",":
	    tokens.push(make_token(T_COMMA));
            next();
	    break;
	  case "\"":
	    tokens.push(make_string());
	  case "t":
	    if (check_literal("true")) {
	      tokens.push(make_token(T_TRUE));
	      next(4);
	    }
	    break;
	  case "f":
	    if (check_literal("false")) {
	      tokens.push(make_token(T_FALSE));
	      next(5);
	    }
	    break;
	  case "n":
	    if (check_literal("null")) {
	      tokens.push(make_token(T_NULL));
	      next(4);
	    }
	    break;
	  case "\n": case "\t": case " ": case "\r":
	    next();
	    break;
          case "-":
	    tokens.push(make_number());
	    break;
          default:
	    if (c >=0 && c <= 9) {
	      tokens.push(make_number());
	    } else {
	      error(cur_idx + "," + c + ","+source);	      
	    }
	    break;
	}
	c = cur_char();
      }
      return tokens;
    };
  })(),

  create_syntax_tree = (function(){
    var tokens, cur_idx,

    next = function(i) {
      cur_idx += i || 1;
    },
    error = function(msg) {
      throw new Error('Invalid syntax:'+msg);
    },

    create_node = function(type) {
      return {
	type : type	
      };
    },
    create_literal_node = function(value) {
      var literal_node = create_node(N_LITERAL);
      literal_node.value = value;
      return literal_node;
    },
    create_obj_node = function() {
      var node = create_node(N_OBJ);
      node.attrs = [];
      return node;
    },
    create_obj_attr = function(key, value) {
      var node = create_node(N_OBJ_ATTR);
      node.key = key;
      node.value = value;
      return node;
    },
    create_array_node = function() {
      var node = create_node(N_ARRAY);
      node.attrs = [];
      return node;
    },

    parse_obj = function(){
      var key, value, node;
      if (tokens[cur_idx].type === T_LBRACKET) {
	node = create_obj_node();

	// Handling empty object
	if (tokens[cur_idx+1].type === T_RBRACKET) {
	  next(2);
	  return node;
	}

	do {
	  next(); // skip { or ,
	  key = parse_string();
	  if (tokens[cur_idx].type !== T_COLON) {
	    error("T_COLON");
	  }
	  next(); // skip :
	  value = parse_value();
	  var attr = create_obj_attr(key, value);
	  node.attrs.push(attr);
	} while (tokens[cur_idx].type === T_COMMA)
      } else {
	error("T_LBRCKET");
      }
      if (tokens[cur_idx].type !== T_RBRACKET) {
	error("T_RBRACKET !="+tokens[cur_idx].type);
      }
      next();  // skip }
      return node;
    },
    parse_array = function() {
      var node, value;
      if (tokens[cur_idx].type === T_LSQRBRACKET) {
        node = create_array_node();

        // Handling empty object
        if (tokens[cur_idx+1].type === T_RSQRBRACKET) {
          next(2);
          return node;
        }
	do {
	  next(); // skip [ or ,
	  value = parse_value();
	  node.attrs.push(value);
	} while (tokens[cur_idx].type === T_COMMA)
      } else {
	error("T_LSQRBRCKET");
      }
      if (tokens[cur_idx].type !== T_RSQRBRACKET) {
	error("T_RSQRBRACKET");
      }
      next(); // skip ]
      return node;

    },
    parse_string = function() {
      if (tokens[cur_idx].type !== T_STRING) {
	error("T_STRING");
      }
      var result = create_literal_node(tokens[cur_idx].value);
      next();
      return result;
    },
    parse_number = function() {
      if (tokens[cur_idx].type !== T_NUMBER) {
	error("T_NUMBER");
      }
      var result = create_literal_node(tokens[cur_idx].value);
      next();
      return result;
    },
    parse_value = function() {
      switch(tokens[cur_idx].type) {
        case T_STRING:
	  return parse_string();
	  break;
	case T_NUMBER:
	  return parse_number();
	  break;
        case T_LBRACKET:
	  return parse_obj();
	  break;
	case T_TRUE:
	  next();
	  return create_literal_node(true);
	  break;
	case T_FALSE:
	  next();
	  return create_literal_node(false);
	  break;
	case T_NULL:
	  next();
	  return create_literal_node(null);
	  break;
	case T_LSQRBRACKET:
	  return parse_array();
	  break;
	default:
	  break;
      }
    };

    return function(token_list) {
      tokens = token_list;
      cur_idx = 0;
      return parse_obj();
    };
  })(),

  create_object_from_tree = (function() {

    var

    generate = function(node){
      switch (node.type) {
	case N_OBJ:
	  var obj = {};
	  for(var i=0, length=node.attrs.length; i<length; i+=1) {
	    // todo: duplicate key.
	    if (node.attrs[i].type === N_OBJ_ATTR) {
	      obj[generate(node.attrs[i].key)] = generate(node.attrs[i].value);
	    }
	  }
	  return obj;
	case N_ARRAY:
	  var array = [];
	  for(var i=0, length=node.attrs.length; i<length; i+=1) {
	    array[i] = generate(node.attrs[i]);
	  }
	  return array;
	case N_LITERAL:
	  return node.value;
	default:
	  return undefined;
      }
    };
    return function(root) {
      tree = root;
      return generate(root);
    };
  })();

  return function (str) {

    var result={}, tokens=[], root={};
    tokens = tokenize(str);
//pretty_print(console.log(tokens));
    root = create_syntax_tree(tokens);
    return create_object_from_tree(root);
  };

}());

//console.log(json_parse('{"key1":"value1", "key2": {"" : "", "key4": {}}}'));
console.log(json_parse('{"key1":"value1", "key2" : {"key2-1":-101}, "key3": [true, {"key3-1":"value3-1"}, null]}'));
console.log(json_parse('{"key1":-0.15}'));
console.log(json_parse('{"key1":10.105}'));
console.log(json_parse('{"key1":-10.105e+010}'));
console.log(json_parse('{"key1":12.005E0}'));
console.log(json_parse('{"key1":-1.23E-1}'));
console.log(json_parse('{"key1":"\\\"a"}'));
console.log(json_parse('{"key2":"\\"a"}'));
// key1: '"a'
console.log(json_parse('{"key3":"\"}'));
// key1: ''
//console.log(json_parse('{"key4":"\\"}'));
// error
//console.log(json_parse('{"key5":"\\\"}'));
// error
console.log(json_parse('{"key6":"\\\\"}'));
// key1: '\\'
console.log(json_parse('{"key7":"/"}'));
console.log(json_parse('{"key8":"\/"}'));
console.log(json_parse('{"key9":"\\/"}'));
console.log(json_parse('{"key10":"\\\/"}'));
// { key7: '/' }
console.log(json_parse('{"key11":"\\\\/"}'));
// key7: '\\/'
console.log(json_parse('{"key12":"\\b\\f\\n\\r\\t"}'));
// key7: '\b\f\n\r\t'
console.log(json_parse('{"key13":"\u007a\\n\u26c4\u3042"}'));
// error

//console.log(json_parse('{"key1":"\\\\"}'));
// 
//console.log(json_parse('{"key1":true}'));
//console.log(json_parse('{"key1":false}'));
//console.log(json_parse('{"key1":null}'));
