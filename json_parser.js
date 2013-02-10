json_parse = (function() {

  var T_STRING = "T0" ,   // String
  T_COLON = "T1",     // :
  T_COMMA = "T2",     // ,
  T_TRUE = "T3",      // true
  T_FALSE = "T4",     // false
  T_NULL = "T5",      // null
  N_OBJ = "N0",       // object
  N_LITERAL = "N1",    // String, Boolean, .. in syntax tree

  tokenize = (function(){
    var tokens = [], source, cur_idx, buf = [],

    next = function (i){
      i = typeof i !== "undefined" ? i : 1;
      cur_idx+=i;
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
          default:
	    break;
	}
	c = cur_char();
      }
      return tokens;
    };
  })(),

  create_syntax_tree = (function(){
    var tokens, 

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

    parse = function(n){
      var node={};

      if (tokens[n] == undefined) {
	return undefined;
      }
      switch (tokens[n].type) {
	case T_STRING:
	  if (tokens[n+1] != undefined && tokens[n+1].type===T_COLON) {
	    node = create_node(N_OBJ);
	    node.key = create_literal_node(tokens[n].value);
	    node.value = parse(n+2);
	    return node;
	  } else {
	    return create_literal_node(tokens[n].value);
	  }
	  break;
	case T_TRUE:
	  return create_literal_node(true);
	  break;
	case T_FALSE:
	  return create_literal_node(false);
	  break;
	case T_NULL:
	  return create_literal_node(null);
	  break;
	default:
	  break;
      }
    };
    return function(token_list) {
      tokens = token_list;
      return parse(0);
    };
  })(),

  create_object_from_tree = (function() {

    var result = {}, 

    generate = function(node){
      switch (node.type) {
	case N_OBJ:
	  result[generate(node.key)] = generate(node.value);
	  return result;
	case N_LITERAL:
	  return node.value;
	default:
	  return undefined;
	  break;
      }
    };
    return function(root) {
      return generate(root);
    };
  })();

  return function (str) {

    var result={}, tokens=[], root={};
    tokens = tokenize(str);
    root = create_syntax_tree(tokens);
//    result[key] = value;
//    return result;
    return create_object_from_tree(root);
  };

}());

console.log(json_parse('"key1":"value1"'));
console.log(json_parse('"key1":true'));
console.log(json_parse('"key1":false'));
console.log(json_parse('"key1":null'));
