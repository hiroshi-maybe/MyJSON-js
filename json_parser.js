json_parse = (function() {

  // Token
  var T_STRING = "T0" ,   // String
  T_COLON = "T1",     // :
  T_COMMA = "T2",     // ,
  T_TRUE = "T3",      // true
  T_FALSE = "T4",     // false
  T_NULL = "T5",      // null
  T_LBRACKET = "T6",    // {
  T_RBRACKET = "T7",    // }
  // Node
  N_OBJ = "N0",       // object
  N_OBJ_ATTR = "N1",    // Boolean, .. in syntax tree
  N_LITERAL = "N2",    // Boolean, .. in syntax tree

  tokenize = (function(){
    var tokens = [], source, cur_idx, buf = [],

    next = function (i){
      //      i = typeof i !== "undefined" ? i : 1;
      cur_idx+=i || 1;
    },
    error = function(msg) {
      throw new Error('Invalid token:'+msg);
    },
    cur_char = function(){
      return source.charAt(cur_idx);
    },
    check_literal = function(literal){
      var result = true;
      for(var i=0, length=literal.length; i<length && result; i+=1) {
	if (literal.charAt(i)!==source.charAt(cur_idx+i)) result=false;
      }
      return result;
    },

    make_string = function(){
      next(); // skip first quote
      var char = source.charAt(cur_idx), buf="";
      while(char!=="\"") {
	buf+=char;
	next();
	char = cur_char();
      }
      next();
      return make_token(T_STRING, buf);
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
          default:
	    error(cur_idx + "," + c + ","+source);
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
	error("T_RBRACKET");
      }
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
    parse_value = function() {
      switch(tokens[cur_idx].type) {
        case T_STRING:
	  return parse_string();
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
	case T_LBRACKET:
	  next();
	  return create_literal_node(null);
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
//console.log(tokens);
    root = create_syntax_tree(tokens);
//console.log(root);
    return create_object_from_tree(root);
  };

}());

console.log(json_parse('{"key1":"value1", "key2": {"key3" : true, "key4": {}}}'));
//console.log(json_parse('{"key1":"value1"}'));
//console.log(json_parse('{"key1":true}'));
//console.log(json_parse('{"key1":false}'));
//console.log(json_parse('{"key1":null}'));
