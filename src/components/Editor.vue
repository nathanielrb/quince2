<template>
  <div id="editor" v-if="file" v-bind:data-repo="repo" v-bind:data-file="file.path">
    <div class="banner">

    <div v-if="editorParams.name != file.name" class="editor-name">{{editorParams.name}}</div>
    <input v-else type="text" v-model="filename"/>


  </div>

  <div id="md-editor-toolbar" class="editor-toolbar">
    <button class="toolbar-button" v-for="btn in buttons" v-on:click="btn.click()" v-bind:title="btn.label">
      <i class="fa" v-bind:class="btn.icon"></i>
    </button>

    <span class="buttons">
      <a v-on:click="save()">
	<i class="fa fa-save"></i>
      </a>
	<a v-if="editorParams.canDelete"  class="file" v-on:click="github.deleteFile(file, close)">
	<i class="fa fa-trash"></i>
      </a>

      <a v-on:click="close()">
	<span class="">X</span>
      </a>
    </span>
<br style="clear:both"/>
  </div>

  <div id="editor-content"></div>
</div>  
</template>


<script>
export default {
  name: 'Editor',
  data () {
        return {
            content: null,
            editorElt: null,
	    file: null,
	    filename: null,
	    changingName: null,
	    editorSvc: null
        };
    },
    props: ['fileUrl', 'token', 'repo', 'username', 'editor', 'github', 'editorParams'],
    computed: {
	newpath: function() { return this.filename != this.file.name },
	buttons: function() { return  this.editorSvc ? this.editorSvc.buttons : null }
    },
    methods: {
	getFile: function () {
	    this.file = null;
	    this.content = null;

	    var vm = this;
	    this.github.getFile(this.fileUrl,
				response => {
				    vm.file = response.body;
				    vm.content = decodeURIComponent(escape(atob(response.body.content)));
				    vm.$nextTick( () => vm.initEditor() );
				});
	},
	unsavedContent: function(){
	    console.log("unsaved? 1:" + this.editorSvc + ", 2:" +  (this.editorSvc && this.content != this.editorSvc.getContent()));
	    return this.editorSvc && this.content != this.editorSvc.getContent()
	},
        close: function(){
	    if(!this.unsavedContent()
	       || confirm("Unsaved changes. Close anyway?")){
		this.$emit('close');
		this.file = null;
		this.buttons = null;
		this.editorSvc = null;
	    }
        },

	save: function(){
	    var callback = null;
            //this.content = this.editorSvc.cledit.getContent();
	    this.content = this.editorSvc.getContent();

	    var afterSave;
	    var vm = this;
	    if(this.newpath){
		var oldfile = JSON.parse(JSON.stringify(this.file));
		afterSave = (response) => {
		    this.github.deleteFile(oldfile,
					   () => {
					       var newfile = response.data.content;

					       vm.$parent.$emit('add-file', newfile);
					       vm.$parent.changeEditingFile(newfile.url);

					       vm.$nextTick( () =>  vm.file = newfile );

					   });

		    vm.unsavedChanges = null;
		}
		
		this.file.sha = null;
		this.file.path = this.file.path.substr(0, this.file.path.lastIndexOf('/'))
		    + '/' + this.filename;
	    }
	    else{
		afterSave = (response) => { vm.file = response.body.content;
					    vm.unsavedChanges = null; }
	    }
	    
	    this.github.saveFile(this.file, this.content, afterSave);
	},
	initEditor: function(){
	    var editorElt = document.querySelector('#editor-content');
	    
	    this.$nextTick(function(){
		console.log(this.editorParams);
		this.editorSvc = this.editor(editorElt,
					     this.content,
					     this.editorParams.options);

	    });
	}
    },
    watch: {
	fileUrl: function(){
	    
            if(this.fileUrl){
		if(!this.newname)
                    this.getFile();
	    }
            else{
                this.content = null;
		this.file = null;
		this.editorSvc = null;
		}
        },
	file: function(){
	    if(this.file){
		this.filename = this.file.name

	    }
	}
    }
 }

</script>
