json_parse = (function() {

  return function (str) {

    var result = {}, key="", value="", kv_trans = false;
    for (var i=0, length=str.length; i<length; i+=1) {
      var c = str.charAt(i);

      switch (c) {
      case ":":
	kv_trans = true;
	break;
      default:
	if (kv_trans) {
	  value += c;
	} else {
	  key += c;
	}
	break;
      }
    }
    result[key] = value;
    return result;

  };

}());

console.log(json_parse("key1:value1"));