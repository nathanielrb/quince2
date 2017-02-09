module.exports = function(vm, params){
    return {
	error: function(response){
	    vm.$emit('error', response.data.message, response.data);
	},
	login: function(){
	    var hash = window.location.hash;
	    
	    var github_uri = "https://github.com/login/oauth/authorize?"
		+ 'client_id=' + params.id
		+ '&redirect_uri=' + params.redirect_uri + encodeURIComponent(hash)
		+ '&state=' + params.state
		+'&scope=repo';
	    
	    window.location.href = github_uri;
	},
	getToken: function(code, callback){
	    var url = params.gateway + code;

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
            vm.$http.get('https://api.github.com/repos/' + vm.repo + '/contents/' + path + '?access_token=' + vm.token)
		.then(response, g.error);
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
	saveFile: function(file, filename, content){
	    
	    var newpath = filename != file.name
		? file.path.substr(0, file.path.lastIndexOf('/'))
		+ '/' + filename
		: null;
	    console.log('new? ' + newpath);
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
	    vm.loading = true;

	    var g = this;
	    vm.$http.put(uri,params)
		.then(
		    function(response){
			vm.loading = null; //vm.$emit('loaded');
			vm.message = "saved"; vm.$emit('msg', "Saved.");
			file.sha = response.data.content.sha;

			if(newpath){
			    console.log("NEW: " + newpath);
			    g.deleteFile(file,
				function(){
				    vm.file = response.data.content;
				    vm.$emit('add-file', file);
				    vm.changeEditingFile();
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

	    console.log("DELETING");
	    console.log(uri);
	    console.log(params);
	    var g = this;
	    vm.$http.delete(uri,params)
		.then(function(response){
		    vm.message = response.data.message; //vm.$emit('msg', response.data.message);
		    vm.$emit('remove-file', file)
			
		    if(callback)
			callback();
		}
		      , g.error);
	    
	}
    }
}
