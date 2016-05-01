import { TableBaseController } from "table-base.js";
import { mapName } from "utils.js";
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
    load(page="", after) {
	let resource = this.resources.getSelected();
	let url = this.SWAPI_BASE + resource.name + "/?page=" + page;
	$("#spinner").show();

	this.ajax.call(`${resource.name}/?page=${page}`)
	    .then(response => {
		$("#btnPrev").prop("disabled", !response.previous);
		$("#btnNext").prop("disabled", !response.next);
		
		$("#table").remove();
		$("#table-template").clone().first().attr("id", "table").show().appendTo($("#rest"));
		
		response.page = this.page;
		
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
		    methods: {
			clickLink: this.clickLink,
			isArray: this.isArray,
			showOnMobile: this.showOnMobile
		    }
		});
		
		this.linkResolver.resolve("#table");
		$("#spinner").hide();
		$("html, body").animate({ scrollTop: 0 });
		$("#table").show();
	    });
    }

    showOnMobile(name) {
	return name == "url";
    }
}
