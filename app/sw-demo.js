import { LinkStore } from "link-store.js"
import { ResourcesController } from "resources.js"
import { ColumnsController } from "columns.js"
import { TableController } from "table.js"
import { LinkResolver } from "link-resolver.js"
import { clone, titleCase, mapName } from "utils.js"

String.prototype.contains = String.prototype.contains || function(needle) {
    return this.indexOf(needle) != -1;
}

//Vue.config.debug = true;
class VueDemo {
    constructor() {
	this.RESOLVE_LINKS = true;
	this.SWAPI_BASE = "http://swapi.co/api/";
	this.LINK_PLACEHOLDER = "";

	this.COMMON_METHODS = {
	    /**
	     * Loads an entity into the entity popup
	     *
	     * @param column		The column containing the link
	     * @param url			The URL of the link
	     * @param event			The click event on the link
	     */
	    clickLink: function (column, url, event) {
		event.preventDefault();
		event.target.classList.add("waiting");
		this.loadEntityPopup(url, () => {
		    event.target.classList.remove("waiting");
		});
	    }.bind(this),
	    
	    isArray: function(x) { return Array.isArray(x); }
	};

	this.ViewModels = {
	    table: null,
	};
	
	this.waiting = {};
	this.linkStore = new LinkStore();
	this.resources = new ResourcesController(this.SWAPI_BASE);
	this.columns = new ColumnsController(this.SWAPI_BASE);
	this.linkResolver = new LinkResolver(this.linkStore);
	this.table = new TableController(this.SWAPI_BASE, this.linkStore, this.linkResolver);
	
	this.entityViewMethods = {
	    clickLink: this.COMMON_METHODS.clickLink,
	    isArray: this.COMMON_METHODS.isArray,
	    showOnMobile: function (name) {
		return name == "url";
	    }.bind(this)
	};
	
	this.entityPopupViewMethods = {
	    clickLink: this.COMMON_METHODS.clickLink,
	    isArray: this.COMMON_METHODS.isArray
	};
	
	this.page = 1;

	///////////////////////////////////////////////////////////////////////////////////////////////
	// Event handlers
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	$("#btnPrev").on("click", e => {
	    this.table.load(--this.page);
	});

	
	$("#btnGet").on("click", e => {
	    this.table.load(this.page)
	});

	
	$("#btnNext").on("click", e => {
	    this.table.load(++this.page)
	});

	
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

	
	$("#overlay, #btnClose").on("click", this.hideOverlay);

	this.resources.load((() => {
	    this.columns.load(this.resources.data.store);
	}).bind(this));
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////////////////////////////////////////////

    
    showOverlay() {
	$("#table-popup, #overlay").fadeIn();
    }


    hideOverlay() {
	$("#table-popup, #overlay").fadeOut();
    }


    
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Data functions
    ///////////////////////////////////////////////////////////////////////////////////////////////




    /**
     * Retrieves entity data then populates and displays the div#table-popup element
     */
    loadEntityPopup(url, callback) {
	let resourceName;
	let match = url.match(/http:\/\/swapi.co\/api\/(\w+).*/);
	if (!match) {
	    return;
	} else {
	    resourceName = match[1];
	}
	
	let resource = this.resources.data.store.find(x => x.name == resourceName);
	if (!resource)
	    return;
	
	let columns = resource.columns;
	
	$.ajax({
	    type: "GET",
	    url: url,
	    success: function(result) {
		$("#rest").append(clone($("#table-popup-template"), true));
		
		new Vue({
		    el: "#table-popup",
		    data: {
			columns,
			result,
			linkStore: this.linkStore.store
		    },
		    methods: this.entityPopupViewMethods
		});

		this.linkResolver.resolve("#table-popup");
		this.showOverlay();	
		if (callback)
		    callback();
	    }.bind(this)
	});
    }
}

export default new VueDemo()
