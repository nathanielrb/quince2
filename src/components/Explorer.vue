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
  
  <ul class="files" v-if="files && dirRules">
    <li v-for="file in sortedFiles" v-bind:class="[file.class, {editing: isEditing(file)}]">
      <a v-on:click="file.click">
	<i class="fa" v-if="file.icon" v-bind:class="file.icon"></i>
	<span v-if="file.html" v-html="file.html"></span>
	<template v-if="!file.html">{{file.name}}</template>
      </a>
      
    </li>
  </ul>
  
  <div class="add">
    <template v-for="rule in createRules">

      <div v-if="typeof rule === 'string'">
	<a v-on:click="showAddFileForm(rule)" v-if="addFileForm != rule">
	  <i class="fa fa-plus"></i> {{rule}} file
	</a>
	<form v-if="addFileForm === rule" v-on:submit.prevent="addFile">
	  <input autofocus v-model="newFileName" type="text" />
	  <b v-if="addFileForm != '*'">.{{rule}}</b>
	  <b v-else>(filename)</b>
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

    <div v-if="dirRules" v-for="rule in uploadsRules">
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

var Filer = require('./../filer/index.js');
var Rules = require('./../rules.js');

export default {
  name: 'hello',
  data () {
        return {
            path: '',
            files: null,
	    newCoverImage: null,
	    newCoverImageForm: null,
	    addFileForm: null,
	    newFileName: null,
	    filer: null
        };
    },
    props: ['username','repo','fileUrl','github'],
    computed: {
        sortedFiles: function() {
	    console.log("SORT FILES");
	    if(this.files)
		return this.files.slice(0)
		.sort(this.filer.filesort)
		.map(this.filer.file(this))
		.filter( function(v){ return v; });
        },
	repoName: function(){
	    return this.repo.split('/')[1].replace(/[-_]/g,' ');
	},
	breadcrumbs: function(){
	    return this.path.split('/')
		.filter(function(e){ return e != '' })
		.reduce(function(prevVal, elem, index, array){
		    return prevVal.concat([  { 
			crumb: elem.replace(/[-_]/g,' '),
			path: prevVal.length > 1
			    ? prevVal[prevVal.length - 1].path + '/' + elem
			    : elem
		    } ]);
		}, [{crumb: this.repoName, path: ''}]);
	},
	dirRules: function(){
	    if(this.filer)
		return this.filer.dir({name: this.path});
	},
	createRules: function(){
	    if(this.dirRules)
		return this.dirRules.create;
	},
	uploadsRules: function(){
	    if(this.dirRules)
		return this.dirRules.uploads;
	},
	uploadFilename: function(){
	    return this.addFileForm.filename;
	}
    },
    methods: {
        changePath: function(path) {

	    if(!this.$parent.unsavedContent()
	       || confirm("Unsaved changes. Close Editor anyway?")){
		this.path = '/' + path;
		this.$emit('change');
		
   		var vm = this;
		this.github.getFiles(this.path, response => { vm.files = response.data } );
		this.updateHash();
	    }
        },
	updateHash: function(){
	    window.location.hash = '#' + this.repo + this.path;
	},
	loadRules: function(){

	    var vm = this;
	    
	    this.github.getFile('https://api.github.com/repos/' + this.repo + '/contents/_quince.json',
				(response) => {
				    if(response && response.body && response.body.content){
					var loadedRules = JSON.parse(decodeURIComponent(escape(atob(response.body.content))));
					var combinedRules = Rules;

					combinedRules.dirRules = loadedRules.dirRules;

					var rule;
					for(var i in loadedRules.fileRules){
					    combinedRules.fileRules.push( loadedRules.fileRules[i] );
					}
					vm.filer = new Filer(combinedRules);
				    }
				    else {
					vm.filer = new Filer(Rules);
				    }
				});
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
	    
	    var newpath = this.path + '/' + name.replace(/\s/g, '-');
	    var vm = this;
	    var filer = vm.filer.file(vm);
	    
	    if(typeof this.addFileForm === 'string'){
		if(this.addFileForm != '*')
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
	chainedUploads: function(files, calculateFilename){
	    var vm = this;
	    if(files.length > 0){
		var file = files[0];
				
		var cb = () => vm.chainedUploads(files.slice(1), calculateFilename);

		var filename = file.filename || calculateFilename(file.title);
		
		vm.uploadFileContent(filename, file.body, cb);
	    }
	    else
		return;
	},
	uploadFileContent(name, content, innerCb){
	    var vm = this;
	    var path = vm.path.slice(1) + '/' + name;

	    var existingFileIndex = vm.files.findIndex( function(f){ return f.name == name } );
	    var existingFile, sha;
	    
	    if(	existingFileIndex > -1){
		existingFile = vm.files[existingFileIndex];
		sha = existingFile.sha;
	    }
	    		    
	    var cb = (response) => { vm.hideAddFileForm();
				     if(existingFile)
					 vm.files.splice(existingFileIndex, 1, response.body.content);

				     else
					 vm.files.push(response.body.content);
				     
				     if(innerCb) innerCb(); };
	    
	    vm.github.uploadFile( path, sha, content, cb );
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
	    
	    var params = {
		file: file,
		path: this.path
	    }

	    var formData = new FormData();
	    formData.append('file', file);
	    formData.append('path',this.path);

	    var vm = this;

	    var calculateFilename = (title) => {
		var nfiles = vm.files.filter( file =>
					      { return file.name.search(ext)
						=== file.name.length - ext.length}).length;
		
		return vm.pad(nfiles, 2) + '_' + title.replace(/ /g,'-') + rule.resultExtension;
	    }
		
	    
	    vm.$http.post(handler, formData)
		.then(function(response){
		    if(response.body && response.body.files){
			vm.chainedUploads(response.body.files, calculateFilename);
		    }
		    else
			alert("Error");
		});
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
	vm.filer = new Filer(Rules);
	
	this.loadRules();
	
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
