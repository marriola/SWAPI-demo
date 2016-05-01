import { LinkStore } from "link-store.js"
import { ResourcesController } from "resources.js"
import { ColumnsController } from "columns.js"
import { clone, titleCase, mapName } from "utils.js"

String.prototype.contains = String.prototype.contains || function(needle) {
    return this.indexOf(needle) != -1;
}

//Vue.config.debug = true;
class VueDemo {
    constructor() {
	this.RESOLVE_LINKS = true;
	this.SWAPI_BASE = "http://swapi.co/api/";
	this.LINK_PLACEHOLDER = "";

	this.COMMON_METHODS = {
	    /**
	     * Loads an entity into the entity popup
	     *
	     * @param column		The column containing the link
	     * @param url			The URL of the link
	     * @param event			The click event on the link
	     */
	    clickLink: function (column, url, event) {
		event.preventDefault();
		event.target.classList.add("waiting");
		this.loadEntityPopup(url, () => {
		    event.target.classList.remove("waiting");
		});
	    }.bind(this),
	    
	    isArray: function(x) { return Array.isArray(x); }
	};

	this.ViewModels = {
	    columns: null,
	    table: null,
	};
	
	this.waiting = {};
	this.linkStore = new LinkStore();
	this.resources = new ResourcesController(this.SWAPI_BASE);
	this.columns = new ColumnsController(this.SWAPI_BASE);
	
	this.entityViewMethods = {
	    clickLink: this.COMMON_METHODS.clickLink,
	    isArray: this.COMMON_METHODS.isArray,
	    showOnMobile: function (name) {
		return name == "url";
	    }.bind(this)
	};
	
	this.entityPopupViewMethods = {
	    clickLink: this.COMMON_METHODS.clickLink,
	    isArray: this.COMMON_METHODS.isArray
	};
	
	this.page = 1;

	///////////////////////////////////////////////////////////////////////////////////////////////
	// Event handlers
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	$("#btnPrev").on("click", e => {
	    this.loadEntities(--this.page);
	});

	
	$("#btnGet").on("click", e => {
	    this.loadEntities(this.page)
	});

	
	$("#btnNext").on("click", e => {
	    this.loadEntities(++this.page)
	});

	
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

	
	$("#overlay, #btnClose").on("click", this.hideOverlay);

	this.resources.load((() => {
	    this.columns.load(this.resources.data.store);
	}).bind(this));
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////////////////////////////////////////////

    
    showOverlay() {
	$("#table-popup, #overlay").fadeIn();
    }


    hideOverlay() {
	$("#table-popup, #overlay").fadeOut();
    }


    
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Data functions
    ///////////////////////////////////////////////////////////////////////////////////////////////



    /**
     * Loads and renders a page of entities
     *
     * @param page {number}		The page number to load
     */
    loadEntities(page="") {
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
		
		response.page = this.page;
		
		this.ViewModels.table = new Vue({
		    el: '#table',
		    data: {
			pageStart: (this.page - 1) * 10 + 1,
			pageEnd: (this.page - 1) * 10 + response.results.length,
			count: response.count,
			resource: resource,
			results: response.results,
			linkStore: this.linkStore.store
		    },
		    methods: this.entityViewMethods
		});
		
		this.resolveLinks("#table");
		$("#spinner").hide();
		$("html, body").animate({ scrollTop: 0 });
		$("#table").show();
	    }.bind(this),
	    error: function(err) { }
	});
    }

    /**
     * Retrieves entity data then populates and displays the div#table-popup element
     */
    loadEntityPopup(url, callback) {
	let resourceName;
	let match = url.match(/http:\/\/swapi.co\/api\/(\w+).*/);
	if (!match) {
	    return;
	} else {
	    resourceName = match[1];
	}
	
	let resource = this.resources.data.store.find(x => x.name == resourceName);
	if (!resource)
	    return;
	
	let columns = resource.columns;
	
	$.ajax({
	    type: "GET",
	    url: url,
	    success: function(result) {
		$("#rest").append(clone($("#table-popup-template"), true));
		
		new Vue({
		    el: "#table-popup",
		    data: {
			columns,
			result,
			linkStore: this.linkStore.store
		    },
		    methods: this.entityPopupViewMethods
		});

		this.resolveLinks("#table-popup");
		this.showOverlay();	
		if (callback)
		    callback();
	    }.bind(this)
	});
    }


    /**
     * Retrieves the name of the item pointed to by each link with the not-set class, and sets its text.
     *
     * @param {string} selector		Optional. A selector for the element to search for links. If null, defauls to the entire document.
     */
    resolveLinks(selector=null) {
	if (!this.RESOLVE_LINKS)
	    return;
	
	let $links = $(".not-set");
	let count = $links.length;
	
	console.log(`Resolving ${count} links...`);
	
	$links.each(((idx, elt) => {
	    let url = elt.getAttribute("href");
	    
	    if (this.waiting[url]) {
		--count;
		return;
	    } else if (this.linkStore.get(url)) {
		$(`[href='${url}']`)
		    .text(this.linkStore.get(url))
		    .removeClass("not-set");
		--count;
		return;
	    }
	    
	    this.waiting[url] = true;
	    
	    $.ajax({
		type: "GET",
		url: url,
		success: function(response) {
		    let name = response.name || response.title;
		    $(`[href='${url}']`)
			.text(name)
			.removeClass("not-set");
		    this.linkStore.add(url, name);
		    
		    if (--count == 0) {
			this.linkStore.save();
			console.log("Done.");
		    }
		}.bind(this)
	    });
	}).bind(this));
    }
}

export default new VueDemo()
