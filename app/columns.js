import { mapName } from "utils.js";
import { Controller } from "controller.js";

export class ColumnsController extends Controller {
    constructor(base) {
	super(base);
	this.retrievedResources = 0;
    }

    /**
     * Retrieves the list of columns for each resource and generates the column filter
     */
    load(resources, after) {
	for (let resource of resources) {
	    $.ajax({
		type: "GET",
		url: this.SWAPI_BASE + resource.name + "/schema",
		error: function () { console.error("error retrieving schema for '" + resource.name+ + "'"); },
		success: function (resource) { return function (response) {
		    resource.columns = Object.keys(response.properties).map(((x, i) => {
			let out = mapName(x);
			out.show = true;
			out.hasUrl = response.properties[x].description.toLowerCase().contains("url");
			return out;
		    }).bind(this));

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
		}.bind(this) }.bind(this)(resource)
	    });
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
