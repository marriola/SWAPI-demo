import { TableBaseController } from "table-base.js"
import { clone } from "utils.js"

export class TablePopupController extends TableBaseController {
    constructor(base, resources, linkStore, linkResolver) {
	super(base, resources, linkStore, linkResolver);

	this.setupEventHandlers();
    }


    setupEventHandlers() {
	$("#overlay, #btnClose").on("click", this.hideOverlay);
    }

    
    /**
     * Retrieves entity data then populates and displays the div#table-popup element
     */
    load(url, callback) {
	let resourceName;
	let match = url.match(/http:\/\/swapi.co\/api\/(\w+).*/);
	if (!match) {
	    return;
	} else {
	    resourceName = match[1];
	}
	
	let resource = this.resources.model.store.find(x => x.name == resourceName);
	if (!resource)
	    return;
	
	let columns = resource.columns;

	this.ajax.call(url, true)
	    .then((result => {
		$("#rest").append(clone($("#table-popup-template"), true));
		
		this.viewmodel = new Vue({
		    el: "#table-popup",
		    data: {
			columns,
			result,
			linkStore: this.linkStore.store
		    },
		    methods: {
			clickLink: this.clickLink,
			isArray: this.isArray			
		    }
		});

		this.linkResolver.resolve("#table-popup");
		this.showOverlay();
		if (callback)
		    callback();
	    }).bind(this));
    }

    
    showOverlay() {
	$("#table-popup, #overlay").fadeIn();
    }


    hideOverlay() {
	$("#table-popup, #overlay").fadeOut();
    }
}