<template>
  <div id="app">
        <div  v-if="!token" class="login">
	  <div>
	    <button  v-on:click="github.login">Log In With GitHub</button>
	  </div>
	  <div >
	    <button  v-on:click="github.netlifylogin">Log In With Netlify</button>
	  </div>
        </div>

      <div v-if="token"  class="row top-banner">

        <div class="logo col-md-2 col-md-offset-1">
  	  <h1><a v-on:click="clearRepo">Quince<span class="blue">*</span></a>

		 <span class="status">
	    <span class="glyphicon glyphicon-refresh spinning" v-if="loading"></span>
	    <span class="fa fa-check" v-if="message"
		  v-bind:title="message"></span>
	    <span class="fa fa-exclamation-circle error" v-if="error"
		  v-bind:title="error"></span>
	  </span> 
	</h1>
        </div>

         <div class="repo col-md-3">	  
	  <div class="select-repo" v-if="repo">
	    <select v-model="repo">
	      <option v-for="repo in repos" v-bind:value="repo">
		{{repo.split('/')[1]}}
		<template v-if="repo.split('/')[0] != username">
		  ({{repo.split('/')[0]}})
		</template>

	      </option>
	    </select>
	  </div>
	</div>

        <div class="logout col-md-1 col-md-offset-5">
	  <span v-if="token">
	    <!--<div class="username">{{username}}-->
	    
	      <a v-on:click="logout"><span class="fa fa-sign-out"></span></a>
          </span>
        </div>

      </div>

      <div v-if="token" class="row">

        <div class="only-panel col-md-10 col-md-offset-1" v-if="!repo">
	  <p class="repo-list">
	    Voir les collections de
	    <a v-for="r in repos" v-on:click="() => repo = r">{{r.split('/')[1].replace('-',' ')}}</a>
	</div>

	
        <div class="side-panel col-md-3 col-md-offset-1" v-if="repo && username">
          <explorer
	     :username="username" :repo="repo" :file-url="fileUrl" :github="github"
	     v-on:change="fileUrl = null"
	     v-on:edit="editFile"
	     v-on:msg="displayMsg"
	     v-on:error="displayError"
	     v-on:loading="startLoading"
	     v-on:loaded="doneLoading">
	     </explorer>
      </div>

	<div class="edit-panel col-md-7 " v-if="repo && username">
          <editor :file-url="fileUrl" :editor="editor" :editor-params="editorParams"
		  :username="username" :repo="repo" :github="github"
		  v-on:close="fileUrl = null"
		  
		  v-on:msg="displayMsg"
		  v-on:error="displayError"
		  v-on:loading="startLoading"
		  v-on:loaded="doneLoading">
	  </editor>
      </div>

  </div><!-- .row -->
</template>

<script>

var utils = require('./../utilities/index.js');
var Github = require('./../github/index.js');

import Explorer from './Explorer.vue'
import Editor from './Editor.vue'


export default {
    name: 'app',
    data () {
	return {
            fullRepoName: null,
            username: null,
	    repos: null,
            repo: null,
            fileUrl: null,
	    editor: null,
	    github: null,
	    loggedIn: false,
	    token: null,
	    message: null,
	    error: null,
	    loading: null,
	    rules: null
	}
    },
    created: function(){
	var storedToken = localStorage.getItem('token');
	var code = utils.getParameter('code');

	// var config = JSON.parse(fs.readFileSync(__dirname + '/../../config/github.json', 'utf-8'));
	var config = { "localhost":
		       {
			   id: 'efe3f24dd42bf7881928',
			   redirect_uri: 'http://localhost:8080',
			   state: 'bobo',
			   gateway: 'http://localhost:9999/authenticate/',
			   netlify_id: '726d154c-9cae-4e51-b65c-77dbe573e46c'
		       },
		       "watchman-angelina-34103.netlify.com": {
			   id: '9596358c85761a48004b',
			   redirect_uri: 'http://watchman-angelina-34103.netlify.com',
			   state: 'bobo',
			   gateway: 'http://watchman-angelina-34103.netlify.com:9999/authenticate/',
			   netlify_id: '726d154c-9cae-4e51-b65c-77dbe573e46c'
		       }
		     }

	this.github = new Github(this, config[window.location.hostname]);
	
	if(storedToken){
	    this.token = storedToken;
	    this.github.getUserName(this.github.getUserRepos(this.initRepo));


	}
	else if(code){
	    var hash = window.location.hash;
	    history.replaceState({},window.document.title, '/' + hash);
	    this.github.getToken(code, function(){ this.github.getUserName(this.github.getUserRepos) });
	}
    },
    methods: {
	initRepo: function(hash){
	    var hash = window.location.hash;

	    if(hash != '' && hash != '#'){
		var path = hash.substr(1).split('/');
		this.repo = path[0] + '/' + path[1];

	    }
	},
	clearRepo: function(){
	    this.error = null;
	    this.msg = null;
	    this.repo = null;
	    this.editingFile = null;
	    window.location.hash = '';
	},
	logout: function(){
	    this.username = null;
	    this.repo = null;
	    this.path = null;
	    this.token = null;
	    this.repos = null;
            this.fileUrl = null;
	    this.editor = null;
	    this.loggedIn = false;
	    window.location.hash = '';
	    localStorage.removeItem('token');
	},
        editFile: function(args){
            this.fileUrl = args.url;
	    this.editor = args.editor;
	    this.editorParams = args.params;

	    window.scrollTo(0,0);
        },
	changeEditingFile: function(fileUrl){
	    this.fileUrl = fileUrl;
	},
	displayMsg: function(msg){
	    this.loading = null;
	    this.error = null;
	    this.message = msg;
	    console.log("Message: " + this.message);
	},
	displayError: function(msg, obj){
	    this.message = null;
	    this.loading = null;
	    this.error =  msg;
	    console.log("Error:" + msg);
	    console.log(obj);
	},
	clearMsg: function(n){
	    this.message = null;
	},
	clearError: function(n){
	    this.error = null;
	},
	startLoading: function(){
	    this.message = null;
	    this.error = null;
	    this.loading = true;
	},
	doneLoading: function(){
	    this.loading = null;
	},
	unsavedContent: function(){
	    var checks =
		this.$children.map( component => {
		    if(component === this)
			return false;

		    if(component.unsavedContent)
			return component.unsavedContent();
		    else
			return false;
		});

	    console.log( checks);
	    console.log( checks.indexOf(true) > -1);
	    return checks.indexOf(true) > -1;
	}
    },
    watch: {
	repo: function(newVal, oldVal){

	}
    },
    components: {
        Editor,
	Explorer
    }    
}
</script>

