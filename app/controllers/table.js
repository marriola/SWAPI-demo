import { TableBaseController } from "controllers/table-base.js";
import { clone, mapName } from "utils.js";
import { Ajax } from "ajax.js";

export class TableController extends TableBaseController {
    constructor(base, resources, linkStore, linkResolver) {
	super(base, resources, linkStore, linkResolver);

	this.page = 1;

	this.setupEventHandlers();
    }


    setupEventHandlers() {
	$("#btnPrev").on("click", e => {
	    this.load(--this.page);
	});

	
	$("#btnGet").on("click", e => {
	    this.load(this.page)
	});

	
	$("#btnNext").on("click", e => {
	    this.load(++this.page)
	});
    }

    
    /**
     * Loads and renders a page of entities
     *
     * @param page {number}		The page number to load
     */
    load(page="", after=null) {
	let resource = this.resources.getSelected();
	let url = this.SWAPI_BASE + resource.name + "/?page=" + page;
	$("#spinner").show();

	this.ajax.call(`${resource.name}/?page=${page}`)
	    .then(response => {		
		clone($("#table-template"), true)
		    .first()
		    .attr("id", "table")
		    .appendTo($("#rest"));
		
		this.viewmodel = new Vue({
		    el: '#table',
		    data: {
			pageStart: (this.page - 1) * 10 + 1,
			pageEnd: (this.page - 1) * 10 + response.results.length,
			count: response.count,
			resource: resource,
			results: response.results,
			linkStore: this.linkStore.store
		    },
		    methods: $.extend({}, this.baseMethods, { showOnMobile: this.showOnMobile })
		});
		
		$("#btnPrev").prop("disabled", !response.previous);
		$("#btnNext").prop("disabled", !response.next);
		$("#spinner").hide();
		$("html, body").animate({ scrollTop: 0 });
		$("#table").show();

	    	this.linkResolver.resolve("#table");
	    });
    }

    showOnMobile(name) {
	return name == "url";
    }
}
