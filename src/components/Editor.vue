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
	    changingName: null,
	    buttons: null,
	    editorSvc: null
        };
    },
    props: ['fileUrl', 'token', 'repo', 'username', 'editor', 'github'],
    computed: {
	newpath: function() { return this.filename != this.file.name }
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
        close: function(){
	    this.$emit('close');
            this.file = null;
        },

	save: function(){
	    var callback = null;
            this.content = this.editorSvc.cledit.getContent();

	    var afterSave;
	    var vm = this;
	    if(this.newpath){
		var oldfile = JSON.parse(JSON.stringify(this.file));
		afterSave = (response) => 
		    this.github.deleteFile(oldfile,
					   () => {
					       var newfile = response.data.content;

					       vm.$parent.$emit('add-file', newfile);
					       vm.$parent.changeEditingFile(newfile.url);

					       vm.$nextTick( () =>  vm.file = newfile );

					   });
		
		this.file.sha = null;
		this.file.path = this.file.path.substr(0, this.file.path.lastIndexOf('/'))
		    + '/' + this.filename;
	    }
	    
	    this.github.saveFile(this.file, this.content, afterSave);
	},
	initEditor: function(){
            this.editorElt = document.querySelector('#editor-content');

	    this.$nextTick(function(){
                this.editorSvc = this.editor(this.editorElt);
		this.buttons = this.editorSvc.buttons;
	    });
	}
    },
    watch: {
	fileUrl: function(){
	    
            if(this.fileUrl){
		if(!this.newname)
                    this.getFile();
	    }
            else
                this.content = null;
        },
	file: function(){
	    if(this.file)
		this.filename = this.file.name
	}
    }
 }

</script>
