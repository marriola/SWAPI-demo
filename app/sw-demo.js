import { LinkStore } from "link-store.js"
import { ResourcesController } from "resources.js"
import { ColumnsController } from "columns.js"
import { TableController } from "table.js"
import { TablePopupController } from "table-popup.js"
import { LinkResolver } from "link-resolver.js"
import { clone, titleCase, mapName } from "utils.js"


//Vue.config.debug = true;
class VueDemo {
    constructor() {
	this.RESOLVE_LINKS = true;
	this.SWAPI_BASE = "http://swapi.co/api/";

	this.linkStore = new LinkStore();
	this.linkResolver = new LinkResolver(this.linkStore);

	this.resources = new ResourcesController(this.SWAPI_BASE);
	this.columns = new ColumnsController(this.SWAPI_BASE);
	this.table = new TableController(this.SWAPI_BASE, this.resources, this.linkStore, this.linkResolver);
	this.tablePopup = new TablePopupController(this.SWAPI_BASE, this.resources, this.linkStore, this.linkResolver);
	
	this.resources.load(() => {
	    this.columns.load(this.resources.model.store);
	});
    }    
}

export default new VueDemo()
