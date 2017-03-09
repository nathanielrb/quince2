var Editors = require('./editors/editors.js');

module.exports = {
    dirRules: [
	{
	    test: /^\/[^/]+$/,
	    create: [{
		type: "dir",
		label: "book",
		files: ["_book.yml","_book.json"]
	    }]
	},
	{
	    test: /^\/[^/]+\/[^/]+$/,
	    create: ["md"],
	    uploads: [
		{
		    name: "Word",
		    extension: /docx?$/,
		    resultExtension: '.md',
		    namebase: 'Chapter',
		    handler: "http://localhost:3000/upload"
		},
		{
		    name: "Cover Image",
		    extension: /jpe?g/,
		    filename: "cover.jpg"
		}
	    ]
	}
    ],
    filerRules:
    [{
	test: /.*[.]md$/,
	icon: "fa-file-o",
	class: "file",
	name: function(file){
	    return file.name.replace('-',' ').replace('.md','').replace(/^[0-9]+_/,'');
	},
	editor: Editors.md
    },
     {
	 test: "_book.yml",
	 icon: "fa-th-list",
	 class: "metadata",
	 name:  "Metadata",
	 editor: Editors.yaml,
	 noDelete: true
     },
     {
	 test: "_book.json",
	 icon: "fa-tachometer",
	 class: "metadata",
	 name: "Settings",
	 editor: Editors.text,
	 noDelete: true
     },
     {
	 test: "cover.jpg",
	 class: "cover",
	 html: function(file){
	     return "<img src='" + file.download_url + '?sha=' + file.sha + "' alt='cover' />";
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
