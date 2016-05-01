import { mapName } from "utils.js";
import { TableBaseController } from "table-base.js";

export class TableController extends TableBaseController {
    constructor(base, resources, linkStore, linkResolver) {
	super(base, resources, linkStore, linkResolver);
    }

    /**
     * Loads and renders a page of entities
     *
     * @param page {number}		The page number to load
     */
    load(page="", after) {
	let resource = this.resources.getSelected();
	let url = this.SWAPI_BASE + resource.name + "/?page=" + page;
	$("#spinner").show();
	
	$.ajax({
	    type: "GET",
	    url: url,
	    success: function (response) {
		$("#btnPrev").prop("disabled", !response.previous);
		$("#btnNext").prop("disabled", !response.next);
		
		$("#table").remove();
		$("#table-template").clone().first().attr("id", "table").show().appendTo($("#rest"));
		
		response.page = $VueDemo.default.page;
		
		this.viewmodel = new Vue({
		    el: '#table',
		    data: {
			pageStart: ($VueDemo.default.page - 1) * 10 + 1,
			pageEnd: ($VueDemo.default.page - 1) * 10 + response.results.length,
			count: response.count,
			resource: resource,
			results: response.results,
			linkStore: this.linkStore.store
		    },
		    methods: {
			clickLink: this.clickLink,
			isArray: this.isArray
		    }
		});
		
		this.linkResolver.resolve("#table");
		$("#spinner").hide();
		$("html, body").animate({ scrollTop: 0 });
		$("#table").show();
	    }.bind(this),
	    error: function(err) { }
	});
    }
}
