import { Controller } from "controllers/controller.js";
import { mapName } from "utils.js";
import { Ajax } from "ajax.js";

export class ResourcesController extends Controller {
    constructor(base) {
	super(base);
	
	this.model = {
	    selected: "0"
	};
    }

    /**
     * Retrieves the list of available resources from the API, then gets columns for each when done
     */
    load(after) {
	this.ajax.call("")
	    .then(response => {
		// Decorate resources list with these properties:
		//
		// displayName    A user-friendly version of the column name
		// index          The column's index in the list
		// columns        A list of this resource's columns
		// selected       True if this resource is selected for searching
		this.model.store = Object.keys(response).map((x, i) => {
		    let out = mapName(x, i);
		    out.columns = [];
		    out.selected = false;
		    return out;
		});

		this.viewModel = new Vue({
		    el: "#resources",
		    data: this.model,
		    methods: {
			selectResource: this.selectResource
		    }
		});
		
		if (after)
		    after();
	    });
    }

    
    /**
     * Returns the resource currently selected by the select#resources element
     */
    getSelected() {
	return this.model.store[this.model.selected];
    }

    
    /**
     * Resets search results when selecting a different resource.
     */
    selectResource (i) {
	$("#table").remove();
	$("#btnPrev, #btnNext").prop("disabled", true);
	$VueDemo.default.table.page = 1;
    }
}
