import { Ajax } from "ajax.js";

export class LinkResolver {
    constructor(linkStore) {
	this.linkStore = linkStore;
	this.waiting = {}
	this.ajax = new Ajax(null);
    }

    /**
     * Retrieves the name of the item pointed to by each link with the not-set class, and sets its text.
     *
     * @param {string} selector		Optional. A selector for the element to search for links. If null, defauls to the entire document.
     */
    resolve(selector=null) {
	if (!$VueDemo.default.RESOLVE_LINKS)
	    return;
	
	let $links = $(".not-set");
	let count = $links.length;
	
	console.log(`Resolving ${count} links...`);
	
	$links.each((idx, elt) => {
	    let url = elt.getAttribute("href");
	    
	    if (this.waiting[url]) {
		--count;
		return;
	    } else if (this.linkStore.get(url)) {
		$(`[href='${url}']`)
		    .text(this.linkStore.get(url))
		    .removeClass("not-set");
		--count;
		return;
	    }
	    
	    this.waiting[url] = true;
	    
	    this.ajax.call(url)
		.then(response => {
		    let name = response.name || response.title;
		    let $links = $(`[href='${url}']`);

		    console.log(`resolving ${$links.length} links with ${url} -> ${name}`);
		    $links
			.text(name)
			.removeClass("not-set");
		    this.linkStore.add(url, name);
		    this.waiting[url] = false;
		    
		    if (--count == 0) {
			this.linkStore.save();
			console.log("Done.");
		    }
		});
	});
    }
}
