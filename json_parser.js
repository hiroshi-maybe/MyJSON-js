json_parse = (function() {

  var T_STRING = "T0" ,   // String
  T_COLON = "T1",     // :
  T_COMMA = "T2",     // ,
  N_OBJ = "N0",       // object
  N_STRING = "N1",    // String in syntax tree

  tokenize = (function(){
    var tokens = [], source, cur_idx, buf = [],

    next = function (){
      cur_idx+=1;
    },
    cur_char = function(){
      return source.charAt(cur_idx);
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

      source = str, cur_idx=0, 
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
    create_string_node = function(value) {
      var str_node = create_node(N_STRING);
      str_node.value = value;
      return str_node;
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
	    node.key = create_string_node(tokens[n].value);
	    node.value = parse(n+2);
	    return node;
	  } else {
	    return create_string_node(tokens[n].value);
	  }
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
	case N_STRING:
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