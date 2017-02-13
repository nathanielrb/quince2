<template>
  <div id="app">
      <div class="row">
      <div class="side-panel col-md-4">
        <div class="logo">
  	  <h1>Quince
		 <span class="status">
	    <span class="glyphicon glyphicon-refresh spinning" v-if="loading"></span>
	    <span class="fa fa-check" v-if="message"
		  v-bind:title="message"></span>
	    <span class="fa fa-exclamation-circle error" v-if="error"
		  v-bind:title="error"></span>
	  </span> 
	</h1>
        </div>

        <div class="login">
	<div v-if="!token" class="login">
	  <button  v-on:click="github.login">Log In With GitHub</button>
	</div>


	<div v-if="token">
	  <div class="username">{{username}}
	    <small><a v-on:click="logout">logout</a></small>
	  </div>
	  
	  <div class="select-repo">
	    <select v-model="repo">
	      <option v-for="repo in repos" v-bind:value="repo">
		<template v-if="repo.split('/')[0] != username">
		  {{repo.split('/')[0]}} :: 
		</template>
		{{repo.split('/')[1]}}
	      </option>
	    </select>
	  </div>
	</div>
      </div><!-- .login -->

	<template v-if="repo && username">
          <explorer
	     :username="username" :repo="repo" :file-url="fileUrl" :github="github"
	     v-on:edit="editFile"
	     v-on:msg="displayMsg"
	     v-on:error="displayError"
	     v-on:loading="startLoading"
	     v-on:loaded="doneLoading">
	     </explorer>
	</template>
      </div>

      <div class="edit-panel col-md-8">
        <editor :file-url="fileUrl" :editor="editor"
			    :username="username" :repo="repo" :github="github"
			    v-on:close="fileUrl = null"

			    v-on:change="changeEditingFile"
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
var fs      = require('fs');
    
import Explorer from './Explorer.vue'
import Editor from './Editor.vue'
import NetlifyAuth from 'netlify-auth-js'

const auth = new NetlifyAuth({
  APIUrl: 'https://auth.netlify.com'
});

auth.signup('nrb','nathaniel@marginalia.be').then(
  (response) => console.log("Confirmation email sent"),
  (error) => console.log("Error during signup: %o", error.msg)
);

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
	    loading: null
	    
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
			   gateway: 'http://localhost:9999/authenticate/'
		       },
		       "watchman-angelina-34103.netlify.com": {
			   id: '9596358c85761a48004b',
			   redirect_uri: 'http://watchman-angelina-34103.netlify.com',
			   state: 'bobo',
			   gateway: 'http://watchman-angelina-34103.netlify.com:9999/authenticate/'
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
	}
    },
    components: {
        Editor,
	Explorer
    }    
}
</script>

