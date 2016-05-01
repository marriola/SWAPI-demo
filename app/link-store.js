export class LinkStore {
    constructor() {
	this.store = this.load();
    }

    add(url, name) {
	this.store[url] = name;
    }

    get(url) {
	return this.store[url] || "";
    }
    
    load() {
	let retrieved;
	
	if (localStorage) {
	    retrieved = localStorage.linkStore;
	} else {
	    m = document.cookie.match(/linkStore=(.*?);/);
	    retrieved = m[1];
	}

	return retrieved && JSON.parse(retrieved) || {};
    }

    save() {
	let linkStoreJson = JSON.stringify(this.VueDemo.linkStore);
	
	if (localStorage) {
	    localStorage.linkStore = linkStoreJson;
	} else {
	    document.cookie = `linkStore='${linkStoreJson}'; expires=Tue, 19 Jan 2038 03:14:07 UTC;`;
	}
    }
}
