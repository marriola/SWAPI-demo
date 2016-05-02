import { LocalStorage } from "local-storage.js";

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
	return LocalStorage.load("linkStore");
    }

    save() {
	LocalStorage.save("linkStore", this.store);
    }
}
