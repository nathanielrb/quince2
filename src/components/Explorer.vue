<template>
<div id="explorer">
    <ul class="breadcrumbs" v-if="files">
      <li class="crumb" v-for="(crumb, index) in breadcrumbs">
	<template v-if="index < breadcrumbs.length - 1">
	  <a v-on:click="changePath(crumb.path)">{{crumb.crumb}}</a> /
	</template>
	<b v-if="index == breadcrumbs.length - 1">{{crumb.crumb}}</b>
      </li>
    </ul>

    <ul class="files" v-if="files">
      <li v-for="file in sortedFiles" v-bind:class="[file.class, {editing: isEditing(file)}]">
	<a v-on:click="file.click">
	  <i class="fa" v-if="file.icon" v-bind:class="file.icon"></i>
	  <span v-if="file.html" v-html="file.html(file)"></span>
	  <template v-if="!file.html">{{file.name()}}</template>
	</a>
	
      </li>
    </ul>

    <div>
      <a v-on:click="showAddFileForm">
	<i class="fa fa-plus"></i> file
      </a>
      <form v-if="addFileForm" v-on:submit.prevent="addFile">
	<input autofocus v-model="newFileName" type="text" v-on:blur="hideAddFileForm" />
	<button>Add</button>
      </form>
    </div>
  </div>
</template>

<script>
var Filer = require('./../filer.js');

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
	    filer: null,
        };
    },
    props: {
        username: {
            type: String,
            required: true
        },
        repo: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String
        },
	github: null
    },
    computed: {
        sortedFiles: function() {
	    console.log(this.files);
	    
	    if(this.files)
		return this.files.slice(0)
		.sort(this.filer.filesort)
		.map(this.filer.file)
		.filter( function(v){ return v; });
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
		}, [{crumb: '..', path: ''}]);
	}
    },
    methods: {
        changePath: function(path) {
	    this.path = path;
   	    var vm = this;
            this.github.getFiles(this.path, (response) => { vm.files = response.data });
	    this.updateHash();
        },
	updateHash: function(){
	    window.location.hash = '#' + this.repo + '/' + this.path;
	},
        goBack: function() {
            this.path = this.path.split('/').slice(0, -1).join('/');
            if (this.path === '') this.path = '/';
	    var vm = this;
            this.github.getFiles(this.path, (response) => { vm.files = response.data });
        },
	ext: function(file){
            var re = /(?:\.([^.]+))?$/;
            return re.exec(file.path)[1];
	},
	isEditing: function(file){
	    return this.fileUrl == file.url;
	},
	isDir: function(file){
	    return file.type == 'dir'
	    	&& file.name[0] != '_';
	},
        isContent: function(file){
	    return ["md","html", "jpg"].indexOf(this.ext(file)) > -1
		&& file.name[0] != '_';
        },
	isMeta: function(file){
	    return ["yml","yaml","json"].indexOf(this.ext(file)) > -1;
        },
	isViewable: function(file){
	    return this.isContent(file)
		|| this.isMeta(file)
		|| this.isDir(file);
	},
	showAddFileForm: function(){
	    this.addFileForm = true;
	},
	hideAddFileForm: function(){
	    this.newFileName = null;
	    this.addFileForm = null;
	},
	addFile: function(){
	    var name = this.newFileName;
	    var newpath = this.path + '/' + name;

	    var vm = this;
	    this.github.putNewFile(newpath, this.files, this.filer);	    
	}
    },
    watch: {
        repo: function(newVal, oldVal) {
            this.path = '/';
	    window.location.hash = '#' + newVal;
	    var vm = this;
            this.github.getFiles(this.path, (response) => { vm.files = response.data });
        }
    },
    created: function() {
	this.filer = new Filer(this);

	var vm = this;
	this.$parent.$on('add-file',
			 function(file){
			     vm.files.push(file);
			 });
	
	this.$parent.$on('remove-file',
			 function(file){
			     var index = vm.files.findIndex(
				 function(f){
				     return f.path == file.path
				 });

			     if(index > -1)
				 vm.files.splice(index, 1);
			 });


	var hash = window.location.hash;
	if(hash != ''){
	    var path = hash.substr(1).split('/').slice(2);
	    this.path = '/' + path.join('/');
	}

        if (this.username && this.repo)
	    this.github.getFiles(this.path, (response) => { vm.files = response.data });
	else
	    console.log("not getting files");
    }
}

</script>