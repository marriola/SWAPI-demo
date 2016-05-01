import { Controller } from "controller.js";
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
	    .then((response => {
		this.model.store = Object.keys(response).map(((x, i) => {
		    let out = mapName(x, i);
		    out.columns = [];
		    out.selected = false;
		    return out;
		}).bind(this));
		
		this.viewModel = new Vue({
		    el: "#resources",
		    data: this.model,
		    methods: {
			selectResource: this.selectResource
		    }
		});
		
		if (after)
		    after();
	    }).bind(this));
    }

    /**
     * Returns the resource currently selected by the select#resources element
     */
    getSelected() {
	return this.model.store[this.model.selected];
    }
    
    selectResource (i) {
	$("#table").remove();
	$("#btnPrev, #btnNext").prop("disabled", true);
	$VueDemo.page = 1;
    }
}
