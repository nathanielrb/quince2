<template>
  <div id="editor" v-if="file">
    <div class="banner">
    <input type="text" v-model="filename"/>

    <span class="buttons">
      <a v-on:click="save()">
	<i class="fa fa-save"></i>
	Save
      </a>
      <!--<a v-on:click="github.deleteFile(file, close)">-->
	<a class="file" v-on:click="github.deleteFile(file, close)">
	<i class="fa fa-trash"></i>
	Delete
      </a>

      <a v-on:click="close()">
	<i class="fa fa-window-close-o"></i>
	Close
      </a>
    </span>
  </div>

  <div id="md-editor-toolbar" class="editor-toolbar" >
    <button class="toolbar-button" v-for="btn in buttons" v-on:click="btn.click()" v-bind:title="btn.label">
      <i class="fa" v-bind:class="btn.icon"></i>
    </button>
  </div>

  <div id="html-editor-toolbar" class="editor-toolbar" v-if="null">
    <button class="toolbar-button">b</button>
  </div>

  <div id="editor-content">{{content}}</div>
</div>  
</template>


<script>
export default {
  name: 'hello',
  data () {
        return {
            content: null,
            editorElt: null,
	    file: null,
	    filename: null,
	    buttons: null
        };
    },
    props: ['fileUrl', 'token', 'repo', 'username', 'editor', 'github'],
    computed: {
        ext: function(){
	    if(this.file){
		var re = /(?:\.([^.]+))?$/;
		return re.exec(this.file.path)[1];
	    }
        }
    },
    methods: {
        getFile: function(){
	    var vm = this;
	    this.file = null;
	    this.content = null;

            console.log("getting file from github");
            this.$http.get(this.fileUrl)
		.then(
		       function(response) {
			       vm.file = response.body;
			       vm.content = decodeURIComponent(escape(atob(response.body.content)));
			       this.$nextTick(function(){
				   vm.initEditor();
			       });
                },
		function(response){
			  vm.$emit('error', response.data.message, response.data);			
		});
        },
        close: function(){
	    this.$emit('close');
	    this.fileUrl = null;
            this.file = null;
        },

	save: function(){
	    var callback = null;
	    console.log(this.editorSvc);
            this.content = this.editorSvc.cledit.getContent();
	    this.github.saveFile(this.file, this.filename, this.content);
	},
	initEditor: function(){
            this.editorElt = document.querySelector('#editor-content');

	    this.$nextTick(function(){
                this.editorSvc = this.editor(this.editorElt);
	    });
	}
    },
    watch: {
	fileUrl: function(){
            console.log("get file: " + this.fileUrl);
	    
            if(this.fileUrl){
                this.getFile();
	    }
            else
                this.content = null;
        },
	file: function(){ this.filename = this.file.name }
    }
 }

</script>
