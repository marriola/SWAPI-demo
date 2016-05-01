import { LinkStore } from "link-store.js"
import { LinkResolver } from "link-resolver.js"
import { ResourcesController } from "controllers/resources.js"
import { ColumnsController } from "controllers/columns.js"
import { TableController } from "controllers/table.js"
import { TablePopupController } from "controllers/table-popup.js"


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
