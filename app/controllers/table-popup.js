import { TableBaseController } from "controllers/table-base.js"
import { clone, join } from "utils.js"

export class TablePopupController extends TableBaseController {
    constructor(base, resources, linkStore, linkResolver) {
	super(base, resources, linkStore, linkResolver);

	this.setupEventHandlers();
    }


    setupEventHandlers() {
	$("#overlay, #btnClose").on("click", this.hideOverlay);

    	$(document).on("keyup", e => {
	    if ((e.which || e.keyCode) == 27) {
		this.hideOverlay();
	    }
	});
    }

    
    showOverlay() {
	$("#table-popup, #overlay").fadeIn();
	$("body").css("overflow", "hidden");
    }


    hideOverlay() {
	$("#table-popup, #overlay").fadeOut();
	$("body").css("overflow", "auto");
    }

    
    /**
     * Retrieves entity data then populates and displays the div#table-popup element
     */
    load(url, callback) {
	let resourceName;
	let match = url.match(this.SWAPI_BASE + "(\\w+)/.*");
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
	    .then(result => {
		$("#rest").append(clone($("#table-popup-template"), true));

		result = join(resource.order.map(x => ({ name: x, value: result[x] })),
			      resource.columns,
			      (r, c) => r.name == c.name);

		let shown = result.filter(x => x.show);
		let hidden = result.filter(x => !x.show);
		result = shown.concat(hidden);
		
		this.viewmodel = new Vue({
		    el: "#table-popup",
		    data: {
			columns,
			result,
			linkStore: this.linkStore.store
		    },
		    methods: this.baseMethods
		});

		this.linkResolver.resolve("#table-popup");
		this.showOverlay();
		if (callback)
		    callback();
	    });
    }

    arrayify(result, columns) {
    }
}
