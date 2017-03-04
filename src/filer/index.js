
var merge = function(rule, github_file, vm){
    var file = {};

    file.url = github_file.url;
    file.icon = rule.icon;
    file.class = rule.class;

    if(typeof rule.name === "function"){
	file.name = rule.name(github_file);
    }
    else if(typeof rule.name === "string")
	file.name = rule.name;
    else
	file.name = github_file.name;

    if(typeof rule.click === "function"){
	file.click = function(){
	    rule.click(github_file, vm);
	}
    }
    else if(rule.editor)
	file.click = function(){
	    vm.$emit('edit', {url: github_file.url, editor: rule.editor, params: { name: file.name, canDelete: !rule.noDelete } });
	}
    else
	file.click = () => 0;

    if(rule.html)
	file.html = rule.html(github_file);

    console.log(file.html)

    return file;
}

var filerRec = function(file, rules, vm, returnFun){
    if(rules.length > 0){
	var rule = rules[0];
	
	switch (typeof rule.test){
	case "string":
	    if(file.name === rule.test)
		return returnFun(rule);
	    else
		return filerRec(file, rules.slice(1), vm, returnFun);
	    break;
	case "function":
	    if(rule.test(file))
		return returnFun(rule); //merge(rule, file, vm);
	    else
		return filerRec(file, rules.slice(1), vm, returnFun);
	    break;
	case "object":
	    if(rule.test.constructor.name === "RegExp"){
		if(rule.test.exec(file.name))
		    return returnFun(rule); //merge(rule, file, vm);
		else
		    return filerRec(file, rules.slice(1), vm, returnFun);
	    }
	    break;
	default:
	    return filerRec(file, rules.slice(1), vm, returnFun);
	}
    }
    else
	return null;
}

var file = function(rules){
    return function(vm){
	return function(file){
	    return filerRec(file, rules, vm, rule => { return merge(rule, file, vm);} );
	}
    }
}

var filesort = function(a, b) {
    if( a.name === 'cover.jpg')
	return -1;
    else if( b.name === 'cover.jpg')
	return 1;
    else if(a.name[0] === '_' && b.name[0] != '_'){
	return -1;
    }
    else if(a.name[0] != '_' && b.name[0] === '_'){
	return 1;
    }
    else if (a.type !== b.type) {
	if (a.type === 'dir') {
            return -1;
	} else {
            return 1;
	}
    }
    else {
	if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
	} else {
            return 1;
	}
    }
}

var defaultDirRule = { create: [] }

module.exports = function(rules){
    return {
	dir: function(dir){ return filerRec(dir, rules.dirRules, null, rule => { return rule })
			    || defaultDirRule },
	file: file(rules.filerRules),
	filesort: filesort
    }
}

