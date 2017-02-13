import NetlifyAuth from './../myNetlify.js'

module.exports = function(vm, params){
    var G = {
	error: function(response){
	    vm.$emit('error', response.data.message, response.data);
	},
	login: function(){
	    var hash = window.location.hash;
	    
	    var github_uri = "https://github.com/login/oauth/authorize?"
		+ 'client_id=' + params.id
		+ '&redirect_uri=' + params.redirect_uri + encodeURIComponent(hash)
		//+ '&redirect_uri=http://' + window.location.host + encodeURIComponent(hash)
		+ encodeURIComponent(hash)
		+ '&state=' + params.state
		+'&scope=repo';

	    window.location.href = github_uri;
	},
	netlifylogin: function(code, callback){

	    netlify.configure({site_id: params.netlify_id});

	    //var cb = () =>  
	    netlify.authenticate({provider:"github", scope: "repo"},
				 function(err,data){
				     if(err)
					 console.log(err);
				     else{
					 vm.token = data.token;
					 localStorage.setItem('token', vm.token);
					 console.log("TOKEN: "+vm.token);

					 G.getUserName(G.getUserRepos);
					 
					 if(callback)
					     callback.apply(vm);

				     }
				 });
	},
	getToken: function(code, callback){
	    var url = params.gateway + code;
	    //var url = 'http://' +  window.location.hostname + ':9999/authenticate/' + code;

	    var g = this;
	    vm.$http.get(url).then(
		function(response){
		    var data = response.data;
		    if(data.token){
			vm.token = data.token;
			localStorage.setItem('token', vm.token);
			
			if(callback)
			    callback.apply(vm);
		    }
		    else{
			vm.token = null;
			localStorage.removeItem('token');
			vm.displayError(data.error, data);
		    }
		},
		g.error);
	},
	getUserName: function(callback){
	    vm.$http.get('https://api.github.com/user?'
			   + 'access_token=' + vm.token)
		.then(
		    function(data){
			vm.username = data.data.login;
			
			if(callback)
			    callback.apply(vm);
		    },
		    function(data){
			vm.token = null;
			localStorage.removeItem('token');
			vm.displayError(data.responseText, data);
		    });
	},
	getUserRepos: function(callback){
	    var g = this;
	    vm.$http.get('https://api.github.com/user/repos?'
			   + 'access_token=' + vm.token)
		.then(
		    function(data){
			var names = data.data.map(
			    function(repo){ return repo.full_name });
			vm.repos = names;
			
			if(callback)
			    callback.apply(vm);
		    },
		    g.error);
	},
	getFiles: function(path, response) {
	    var g = this;
            vm.$http.get('https://api.github.com/repos/' + vm.repo + '/contents' + path + '?access_token=' + vm.token)
		.then(response, g.error);
        },
	getFile: function(url, callback){
	    var g = this;
	    vm.$http.get(url)
		.then(callback, g.error);
        },
	putNewFile: function(newpath, files, filer){
	    var uri =  'https://api.github.com/repos/'
		+ vm.repo + '/contents'
		+ newpath + '?access_token=' + vm.token;

	    var params = {
		"message": "Created in Quince.",
		"path": newpath,
		"content": ''
	    }

	    var g = this;
	    vm.$http.put(uri,params)
		.then(
		    function(response){
			var newfile = response.data.content;
			files.push(newfile);
			filer.file(newfile).click();
		    }
		    , g.error);
	},
	saveFile: function(file, content, callback){

	    var uri =  'https://api.github.com/repos/'
		+ vm.repo + '/contents/'
		+ file.path + '?access_token=' + vm.token;

	    var params = {
		"message": "Edited from Quince.",
		"path": file.path,
		"content": btoa(unescape(encodeURIComponent(content)))
	    }

	    if(file.sha)
		params["sha"] = file.sha;
		
	    var g = this;
	    vm.startLoading();

	    vm.$http.put(uri, params)
		.then(
		    function(response){
			vm.doneLoading();
			vm.displayMsg("Saved.");

			if(callback)
			    callback(response);
		    }
		    , g.error);
	},
	oldSaveFile: function(file, filename, content){

	    var newpath = filename != file.name
		? file.path.substr(0, file.path.lastIndexOf('/'))
		+ '/' + filename
		: null;

	    var uri =  'https://api.github.com/repos/'
		+ vm.repo + '/contents/'
		+ (newpath ? newpath : file.path) + '?access_token=' + vm.token;

	    var params = {
		"message": "Edited from Quince.",
		"path": file.path,
		"content": btoa(unescape(encodeURIComponent(content)))
	    }

	    if(!newpath)
		params["sha"] = file.sha;
		
	    var callback =
		newpath
		? this.deleteFile
		: null;

	    vm.message = null;
	    vm.error = null;
	    vm.startLoading();

	    var g = this;
	    vm.$http.put(uri, params)
		.then(
		    function(response){
			vm.doneLoading();
			vm.displayMsg("Saved.");
			file = response.data.content;

			if(newpath){
			    g.deleteFile(file,
					 () => {
					     console.log("Changing to " + file.url);
					     console.log(file);
					     vm.$emit('add-file', file);
					     // vm.changeEditingFile(file.url);
					     //vm.$emit('change', vm.file.url);
					 });
			}
		    }
		    , g.error);
	},
	deleteFile: function(file, callback){

	    var uri =  'https://api.github.com/repos/'
		+ vm.repo + '/contents/'
		+ file.path + '?access_token=' + vm.token;
	    
	    var params = {
		"message": "Deleted from Quince.",
		"path": file.path,
		"sha": file.sha
	    }

	    var g = this;

	    vm.startLoading();
	    vm.$http.delete(uri, {params: params})
		.then(response => {
		    vm.doneLoading();
		    vm.displayMsg("Deleted.");
		    vm.$emit('remove-file', file)
			
		    if(callback)
			callback();
		}, g.error);
	    
	}
    }

    return G;
}
