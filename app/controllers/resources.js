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
