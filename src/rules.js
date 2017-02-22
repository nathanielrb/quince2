var Editors = require('./editors/editors.js');

module.exports = {
    filerRules:
    [{
	test: /.*[.]md$/,
	icon: "fa-file-o",
	class: "file",
	name: function(file){
	    return file.name;
	},
	editor: Editors.md
    },
     {
	 test: "_book.yml",
	 icon: "fa-th-list",
	 class: "metadata",
	 name:  "Metadata",
	 editor: Editors.md
     },
     {
	 test: "_book.json",
	 icon: "fa-tachometer",
	 class: "metadata",
	 name: "Settings",
	 editor: Editors.md,
     },
     {
	 test: "cover.jpg",
	 class: "cover",
	 html: function(file){
	     return "<img src='" + file.download_url + "' alt='cover' />";
	 },
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
