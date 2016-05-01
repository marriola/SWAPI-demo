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
	this.resources = new ResourcesController(this.SWAPI_BASE);
	this.columns = new ColumnsController(this.SWAPI_BASE);
	this.linkResolver = new LinkResolver(this.linkStore);
	this.table = new TableController(this.SWAPI_BASE, this.resources, this.linkStore, this.linkResolver);
	this.tablePopup = new TablePopupController(this.SWAPI_BASE, this.resources, this.linkStore, this.linkResolver);
	
	this.setupEventHandlers();	

	this.resources.load((() => {
	    this.columns.load(this.resources.data.store);
	}).bind(this));
    }


    setupEventHandlers() {	
	$("#columnFilterExpand").on("click", e => {
	    let open = $("#expandIndicator").hasClass("open");
	    
	    if (open) {
		$("#expandIndicator").removeClass("open").addClass("closed");
		$("#columns").toggle(500);
	    } else {
		$("#expandIndicator").removeClass("closed").addClass("open");
		$("#columns").toggle(500);
	    }
	});	
    }

    
}

export default new VueDemo()
