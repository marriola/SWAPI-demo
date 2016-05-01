import { Controller } from "controllers/controller.js";
import { mapName } from "utils.js";
import { Ajax } from "ajax.js";

export class ColumnsController extends Controller {
    constructor(base) {
	super(base);

	this.retrievedResources = 0;

	this.setupEventHandlers();
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

    
    /**
     * Retrieves the list of columns for each resource and generates the column filter
     */
    load(resources, after) {
	for (let resource of resources) {
	    this.ajax.call(`${resource.name}/schema`)
		.then((resource => { return response => {
		    resource.columns = Object.keys(response.properties).map((x, i) => {
			let out = mapName(x);
			out.show = true;
			out.hasUrl = response.properties[x].description.toLowerCase().contains("url");
			return out;
		    });

		    if (++this.retrievedResources == resources.length) {
			this.viewmodel = new Vue({
			    el: "#columns",
			    data: { resources },
			    methods: {
				showColumns: this.showColumns
			    }
			});
			
			$("#please-wait").fadeOut(250, function() {
			    $("#controls").slideDown(250);
			});
			
			$("#btnGet").prop("disabled", false);
		    }
		} })(resource));
	}

	if (after)
	    after();
    }

    showColumns(resource) {
	$(".columnName").removeClass("selected");
	$(`.columnName[data-index='${resource.index}']`).addClass("selected");
	
	if ($(".columnPage:visible").length == 0) {
	    $(`.columnPage[data-index='${resource.index}']`).slideDown(250);
	} else {
	    $(".columnPage:visible").fadeOut(250, function() {
		$(`.columnPage[data-index='${resource.index}']`).fadeIn(250);
	    });
	}				
    }
}
