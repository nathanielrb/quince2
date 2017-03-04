<template>
<div id="explorer">
  <ul class="breadcrumbs" v-if="files">
      <li class="crumb" v-for="(crumb, index) in breadcrumbs">
	<template v-if="index < breadcrumbs.length - 1">
	  <a v-on:click="changePath(crumb.path)">{{crumb.crumb}}</a>
	</template>
	<span v-if="index == breadcrumbs.length - 1">{{crumb.crumb}}</span>
      </li>
    </ul>
  
  <ul class="files" v-if="files">
    <li v-for="file in sortedFiles" v-bind:class="[file.class, {editing: isEditing(file)}]">
      <a v-on:click="file.click">
	<i class="fa" v-if="file.icon" v-bind:class="file.icon"></i>
	<span v-if="file.html" v-html="file.html"></span>
	<template v-if="!file.html">{{file.name}}</template>
      </a>
      
    </li>
  </ul>
  
  <div class="add">
    <template v-for="rule in dirRules.create">

      <div v-if="typeof rule === 'string'">
	<a v-on:click="showAddFileForm(rule)" v-if="addFileForm != rule">
	  <i class="fa fa-plus"></i> {{rule}} file
	</a>
	<form v-if="addFileForm === rule" v-on:submit.prevent="addFile">
	  <input autofocus v-model="newFileName" type="text" />
	  <b>.{{rule}}</b>
	  <a v-on:click="hideAddFileForm">Cancel</a>
	</form>
      </div>

      <div v-else>
	<a v-on:click="showAddFileForm(rule)" v-if="addFileForm != rule">
	  <i class="fa fa-plus"></i> {{rule.label}}
	</a>
	<form v-if="addFileForm === rule" v-on:submit.prevent="addFile">
	  <input autofocus v-model="newFileName" type="text"/>
	  <a v-on:click="hideAddFileForm">Cancel</a>
	</form>
      </div>
      
    </template>

    <div v-for="rule in dirRules.uploads">
      <a v-if="addFileForm != rule" v-on:click="showAddFileForm(rule)">
	<i class="fa fa-upload"></i>    {{rule.name}}
      </a>

      <form v-if="addFileForm === rule && !rule.handler" v-on:submit.prevent="uploadFile">
	<input type="file" name="rule.filename"></input>
	<input type="submit" v-on:submit.prevent="4"></input>
	<a v-on:click="hideAddFileForm">Cancel</a>
      </form>
      <form v-if="addFileForm === rule && rule.handler" v-on:submit.prevent="uploadFileHandler">
	<input type="file" name="rule.filename"></input>
	<input type="submit" v-on:submit.prevent="4"></input>
	<a v-on:click="hideAddFileForm">Cancel</a>
      </form>
    </div>
    
  </div>
  </div><!-- #explorer-->
</template>

<script>

export default {
  name: 'hello',
  data () {
        return {
            path: '',
            files: null,
	    newCoverImage: null,
	    newCoverImageForm: null,
	    addFileForm: null,
	    newFileName: null
        };
    },
    props: ['username','repo','fileUrl','github', 'filer'],
    computed: {
        sortedFiles: function() {
	    if(this.files)
		return this.files.slice(0)
		.sort(this.filer.filesort)
		.map(this.filer.file(this))
		.filter( function(v){ return v; });
        },
	repoName: function(){
	    return this.repo.split('/')[1];
	},
	breadcrumbs: function(){
	    return this.path.split('/')
		.filter(function(e){ return e != '' })
		.reduce(function(prevVal, elem, index, array){
		    return prevVal.concat([  { 
			crumb: elem,
			path: prevVal.length > 1
			    ? prevVal[prevVal.length - 1].path + '/' + elem
			    : elem
		    } ]);
		}, [{crumb: 'Cetri', path: ''}]);
	},
	dirRules: function(){
	    return this.filer.dir({name: this.path});
	},
	uploadFilename: function(){
	    return this.addFileForm.filename;
	}
    },
    methods: {
        changePath: function(path) {
	    this.path = '/' + path;

   	    var vm = this;
            this.github.getFiles(this.path, response => { vm.files = response.data } );
	    this.updateHash();
        },
	updateHash: function(){
	    window.location.hash = '#' + this.repo + this.path;
	},
	pathFromHash: function(){
	    var hash = window.location.hash;

	    if(hash != ''){
		var path = hash.substr(1).split('/').slice(2);
		this.path = '/' + path.join('/');
	    }
	    else{
		this.path = '/';
		this.updateHash();
	    }		
	},
	isEditing: function(file){
	    return this.fileUrl == file.url;
	},
	showAddFileForm: function(ext){
	    this.addFileForm = ext;
	},
	hideAddFileForm: function(){
	    this.newFileName = null;
	    this.addFileForm = null;
	},
	addFile: function(){
	    var name = this.newFileName;
	    
	    var newpath = this.path + '/' + name;
	    var vm = this;
	    var filer = vm.filer.file(vm);
	    
	    if(typeof this.addFileForm === 'string'){
		newpath += "." + this.addFileForm;
		var cb = function(response){
		    var newfile = response.data.content;
		    vm.hideAddFileForm();
		    vm.files.push(newfile);
		    filer(newfile).click();
		}
		this.github.putNewFile(newpath, cb);
	    }
	    else {
		var files = this.addFileForm.files;
		var cb = function(i){
		    if(files[i]){
			vm.github.putNewFile(newpath + '/' + files[i], () => cb(i+1) );
		    }
		    else{
			vm.changePath(newpath);
		    }	
		}

		cb(0);
	    }
	},
	pad: function(num, size) {
	    var s = num+"";
	    while (s.length < size) s = "0" + s;
	    return s;
	},
	uploadFileHandler: function(ele){
	    var rule = this.addFileForm;
	    var handler = rule.handler;
	    var namebase = rule.namebase;
	    var ext = rule.resultExtension;
	  
	    var nfiles = this.files.filter( file => { return file.name.search(ext) === file.name.length - ext.length}).length;
	  
	    var i = 0; // first <input> is file; this should be generalized
	    
	    var files = ele.target[0].files || ele.dataTransfer.files;
	    var read = new FileReader();
	    
	    if (!files.length) {
                return;
	    }
	    
	    var file = files[0];
	    
	    console.log(file);
	    
	    var params = {
		file: file,
		path: this.path
	    }

	    var formData = new FormData();
	    formData.append('file', file);
	    formData.append('path',this.path);

	    var vm = this;
	    var chainedUploads = function(files){
		if(files.length > 0){
		    var file = files[0];
		    var nfiles = vm.files.filter( file => { return file.name.search(ext) === file.name.length - ext.length}).length;
		    var name = namebase + vm.pad(nfiles, 2) + rule.resultExtension;

		    var cb = () => chainedUploads(files.slice(1));

		    vm.uploadFileContent(name, btoa(file), cb);
		}
		else
		    return;
	    }
	    
	    vm.$http.post(handler, formData)
		.then(function(response){
		    if(response.body && response.body.files){
			var files = response.body.files;
			chainedUploads(files);
			/*
			files.map( (file, index) => {
			    var name = namebase + vm.pad(nfiles+index, 2) + rule.resultExtension;
			    
			    vm.uploadFileContent(name, btoa(file));
			})
                        */
		    }
		    else
			alert("Error");
		});
	},
	uploadFileContent(name, content, innerCb){
	    var vm = this;
	    var path = vm.path.slice(1) + '/' + name;
	    var existingFiles = vm.files.filter(function(f){ return f.name == name });
	    var sha = 
		existingFiles.length
		? existingFiles[0].sha
		: null;
	    		    
	    var cb = (response) => { vm.hideAddFileForm(); vm.files.push(response.body.content); innerCb(); };
	    
	    vm.github.uploadFile( path, sha, content, cb );
	},
	uploadFile: function(ele){
	    var i = 0; // first <input> is file; this should be generalized

	    var files = ele.target[0].files || ele.dataTransfer.files;
	    var read = new FileReader();
	    
            if (!files.length) {
                return;
            }

	    var file = files[0];

	    read.readAsBinaryString(file);
	    //read.readAsDataURL(file);

	    var vm = this;
	    read.onloadend = function(){
		var name =
		    vm.uploadFilename
		    ? vm.uploadFilename
		    : file.name;

		vm.uploadFileContent(name, btoa(read.result));
		return;
		
	    }
	}
    },
    watch: {
        repo: function(newVal, oldVal) {
	    this.changePath('/');
        }
    },
    created: function() {
	var vm = this;

	this.$parent.$on('add-file', file =>  vm.files.push(file) );

	this.$parent.$on('remove-file',
			 function(file){
			     var index = vm.files.findIndex(f => { return f.path == file.path } );

			     if(index > -1)
				 vm.files.splice(index, 1);
			 });


	this.pathFromHash();

        if (this.username && this.repo)
	    this.github.getFiles(this.path, (response) => { vm.files = response.data });
	else
	    this.$parent.displayError('No username or repository chosen.');
    }
}

</script>
