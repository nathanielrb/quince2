module.exports = {
    dirRules: [
	{
	    test: /.*/,
	    create: ["*"]
	}
    ],
    fileRules:
    [{
	test: /.*[.]md$/,
	icon: "fa-file-o",
	class: "file",
	name: function(file){
	    return file.name.replace(/[-_]/g,' ').replace('.md','').replace(/^[0-9]+_/,'');
	},
	editor: "md"
    },
     {
	 test: "_book.ymlxxx",
	 icon: "fa-th-list",
	 class: "metadata",
	 name:  "Metadata",
	 editor: "yaml",
	 editorOptions: {
	     schema: {
		 title: "metadata",
		 type: "object",
		 properties: {
		     Title: { type: "string" },
		     Author: { type: "array", items: { type: "string" } },
		     Isbn: { type: "string" },
		 }
	     }
	 },
	 noDelete: true
     },
     {
	 test: "_book.json",
	 icon: "fa-tachometer",
	 class: "metadata",
	 name: "Settings",
	 editor: "text",
	 editorOptions: {
	     schema: {
		 title: "metadata",
		 type: "object",
		 properties: {
		     PDF: { type: "string" },
		     CSS: { type: "array", items: { type: "string" } }
		 }
	     }
	 },

	 noDelete: true
     },
     {
	 test: "cover.jpg",
	 class: "cover",
	 html: function(file){
	     return "<img src='" + file.download_url + '?sha=' + file.sha + "' alt='cover' />";
	 }
     },
     {
	 test: function(file){
	     return file.type == 'dir'
	    	 && file.name[0] != '_';
	 },
	 icon: "fa-folder-o",
	 class: "directory",
	 name: function(file){
	     return file.name;
	 },
	 click: function(file, vm){
	     vm.changePath(file.path); 
	 },
     }]
}
