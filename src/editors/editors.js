window.diff_match_patch = require('googlediff'); ///javascript/diff_match_patch_uncompressed');

require('clunderscore/clunderscore');
require('prismjs/components/prism-core');
//require('prismjs/components/prism-yaml');
//require('./prism-yaml.js');

require('../../node_modules/cledit/scripts/cleditCore.js');
require('../../node_modules/cledit/scripts/cleditHighlighter.js');
require('../../node_modules/cledit/scripts/cleditKeystroke.js');
require('../../node_modules/cledit/scripts/cleditMarker.js');
require('../../node_modules/cledit/scripts/cleditSelectionMgr.js');
require('../../node_modules/cledit/scripts/cleditUndoMgr.js');
require('../../node_modules/cledit/scripts/cleditUtils.js');
require('../../node_modules/cledit/scripts/cleditWatcher.js');

var Pagedown = require('./cledit/pagedown.js');
var buttonBar = require('./cledit/buttonBar.js');
var mdGrammar = require('./cledit/mdGrammar.js');

var yaml = require('js-yaml');

window.Prism.hooks.add('wrap', function(env) {
    if (env.type === 'img') {
	var src = env.content.match(/[\w-_]+\.jpg/); // allow for URLs! and check for ""'s...
	var editor = document.querySelector('#editor');
	var repo = editor.dataset.repo;
	var path = editor.dataset.file.replace(/\/[^\/]+$/,'');

	var link = "https://raw.githubusercontent.com/" + repo + '/master/' + path + '/' + src[0];
	console.log(link);
	
	if(src)
	    env.content = "<p><img src='" + link + "'/></p>" + env.content
    }
});




module.exports = {
    image: function(elt, src){
	var img = document.createElement("img");
	console.log(content);
	img.src =  "data:image/jpg;base64," + btoa(content);
	elt.appendChild(img);
	
    },
    text: function(elt, content){
	elt.setAttribute("contentEditable",true);

	return {
	    getContent: () => { return elt.innerHTML },
	    buttons: null
	}
    },
    yaml: function(elt, content, options){

	var BrutusinForms = brutusin["json-forms"];
	var bf = BrutusinForms.create(options.schema);

	bf.render(elt, yaml.safeLoad(content));
	
	return {
	    getContent: () => yaml.safeDump(bf.getData()),
	    buttons: null
	}
    },
    md: function(elt, content){
	elt.textContent = content;
        var editor = window.cledit(elt);
	var pd = new Pagedown({input: editor});

        var prismGrammar = mdGrammar({
	    fences: true,
	    tables: true,
	    footnotes: true,
	    abbrs: true,
	    deflists: true,
	    tocs: true,
	    dels: true,
	    subs: true,
	    sups: true
        })

	editor.init({
		sectionHighlighter: function (section) {
                    return window.Prism.highlight(section.text, prismGrammar)
		},
		
		// Optional (increases performance on large documents)
		sectionParser: function (text) {
                    var offset = 0
                    var sectionList = []
                    ;(text + '\n\n').replace(/^.+[ \t]*\n=+[ \t]*\n+|^.+[ \t]*\n-+[ \t]*\n+|^\#{1,6}[ \t]*.+?[ \t]*\#*\n+/gm, function (match, matchOffset) {
			sectionList.push(text.substring(offset, matchOffset))
			offset = matchOffset
                    })
                    sectionList.push(text.substring(offset))
                    return sectionList
		}
            })


	pd.run();

	var buttons = new buttonBar({ cledit: editor, pagedownEditor: pd });

	return {
	    getContent: editor.getContent,
	    buttons: buttons
	    // watcher: observer
	}
    }
}
	
