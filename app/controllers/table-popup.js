import { TableBaseController } from "controllers/table-base.js"
import { ColumnValueComponent } from "components/column-val.js"
import { cloneTemplate, join } from "utils.js"

export class TablePopupController extends TableBaseController {
    constructor(base, resources, linkStore, linkResolver) {
	super(base, resources, linkStore, linkResolver);

	this.model = {
	    columns: [],
	    shown: [],
	    hidden: [],
	    showHidden: false,
	    linkStore: {}
	};
	
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
	
	this.ajax.call(url, true)
	    .then(result => {
		result = join(resource.order.map(x => ({ name: x, value: result[x] })),
			      resource.columns,
			      (r, c) => r.name == c.name);

		this.model.columns = resource.columns;
		this.model.shown = result.filter(x => x.show);
		this.model.hidden = result.filter(x => !x.show);
		this.model.linkStore = this.linkStore.store;
		this.model.showHidden = false;
		
		this.viewmodel = cloneTemplate("table-popup", {
		    components: {
			value: ColumnValueComponent
		    },

		    data: this.model,
		    
		    methods: {
			revealHiddenColumns: this.revealHiddenColumns
		    }
		});

		this.linkResolver.resolve("#table-popup");
		this.showOverlay();
		if (callback)
		    callback();
	    });
    }

    revealHiddenColumns() {
	let $scroll = $("#table-popup-scroll");

	$scroll.animate({
	    slideTop: $scroll.offset().top + $scroll.offsetHeight()
	});
	
	this.model.showHidden = true;
    }
}
