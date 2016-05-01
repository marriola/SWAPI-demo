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
	    resources: null,
	    columns: null,
	    table: null,
	};
	
	this.VueDemo = {
	    waiting: {},
	    linkStore: this.getLinkStore(),
	    
	    resourcesView: {
		selected: "0",	
	    },
	    
	    resourcesViewMethods: {	
		selectResource: function(i) {
		    $("#table").remove();
		    $("#btnPrev, #btnNext").prop("disabled", true);
		    this.VueDemo.page = 1;
		}.bind(this)
	    },
	    
	    columnViewMethods: {
		showColumns: function(resource) {
		    $(".columnName").removeClass("selected");
		    $(`.columnName[data-index='${resource.index}']`).addClass("selected");
		    
		    if ($(".columnPage:visible").length == 0) {
			$(`.columnPage[data-index='${resource.index}']`).slideDown(250);
		    } else {
			$(".columnPage:visible").fadeOut(250, function() {
			    $(`.columnPage[data-index='${resource.index}']`).fadeIn(250);
			});
		    }				
		}.bind(this)
	    },
	    
	    entityViewMethods: {
		clickLink: this.COMMON_METHODS.clickLink,
		isArray: this.COMMON_METHODS.isArray,
		showOnMobile: function (name) {
		    return name == "url";
		}.bind(this)
	    },
	    
	    entityPopupViewMethods: {
		clickLink: this.COMMON_METHODS.clickLink,
		isArray: this.COMMON_METHODS.isArray
	    },
	    
	    viewModel: null,
	    page: 1,
	    resources: [],
	    retrievedResources: 0
	};

	///////////////////////////////////////////////////////////////////////////////////////////////
	// Event handlers
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	$("#btnPrev").on("click", e => {
	    this.loadEntities(--this.VueDemo.page);
	});

	
	$("#btnGet").on("click", e => {
	    this.loadEntities(this.VueDemo.page)
	});

	
	$("#btnNext").on("click", e => {
	    this.loadEntities(++this.VueDemo.page)
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

	this.getResources();
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////////////////////////////////////////////

    
    getLinkStore() {
	let retrieved;
	
	if (localStorage) {
	    retrieved = localStorage.linkStore;
	} else {
	    m = document.cookie.match(/linkStore=(.*?);/);
	    retrieved = m[1];
	}

	return retrieved && JSON.parse(retrieved) || {};
    }


    saveLinkStore() {
	let linkStoreJson = JSON.stringify(this.VueDemo.linkStore);
	
	if (localStorage) {
	    localStorage.linkStore = linkStoreJson;
	} else {
	    document.cookie = `linkStore='${linkStoreJson}'; expires=Tue, 19 Jan 2038 03:14:07 UTC;`;
	}
    }
    

    showOverlay() {
	$("#table-popup, #overlay").fadeIn();
    }


    hideOverlay() {
	$("#table-popup, #overlay").fadeOut();
    }

    /**
     * Returns a clone of a template element. If the element's ID ends in "-template", that portion is removed from the cloned element.
     *
     * @param $elt {JQuery}			The element to clone
     * @param replace {Boolean}		True if the last cloned element with this ID should be removed
     */
    clone($elt, replace=false) {
	let id = $elt.attr("id").replace("-template", "");
	if (replace)
	    $("#" + id).remove();
	return $elt.clone().first().attr("id", id);
    }

    
    /**
     * Returns the resource currently selected by the select#resources element
     */
    getSelectedResource() {
	return this.VueDemo.resources[this.VueDemo.resourcesView.selected];
    }


    /**
     * Converts words separated by underscores to title case
     */
    titleCase(str) {
	return str.split("_")
	    .map((x, i) => x[0].toUpperCase() + x.substr(1))
	    .join(" ");
    }


    /**
     * Maps a name onto an object containing the original name, the title-cased name, and its index
     *
     * @param name {String}		The name of the item
     * @param index {Number}	The index of the item in its list (of resources or columns)
     *
     * @returns {Object}
     */
    mapName(name, index) {
	return {
	    name: name,
	    displayName: this.titleCase(name),
	    index
	};
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Data functions
    ///////////////////////////////////////////////////////////////////////////////////////////////

    
    /**
     * Retrieves the list of available resources from the API, then gets columns for each when done
     */
    getResources() {
	$.ajax({
	    type: "GET",
	    url: this.SWAPI_BASE,
	    success: function(response) {
		this.VueDemo.resources = Object.keys(response).map(((x, i) => {
		    let out = this.mapName(x, i);
		    out.columns = [];
		    out.selected = false;
		    return out;
		}).bind(this));
		
		this.VueDemo.resourcesView.resources = this.VueDemo.resources;
		
		this.ViewModels.resources = new Vue({
		    el: "#resources",
		    data: this.VueDemo.resourcesView,
		    methods: this.VueDemo.resourcesViewMethods
		});
		
		this.getColumns();
	    }.bind(this),
	    error: function() { alert("couldn't get resources"); }
	});
    }


    /**
     * Retrieves the list of columns for each resource and generates the column filter
     */
    getColumns() {
	for (let resource of this.VueDemo.resources) {
	    $.ajax({
		type: "GET",
		url: this.SWAPI_BASE + resource.name + "/schema",
		error: function () { alert("error retrieving schema for '" + resource.name + "'"); },
		success: function (resource) { return function (response) {
		    resource.columns = Object.keys(response.properties).map(((x, i) => {
			let out = this.mapName(x);
			out.show = true;
			out.hasUrl = response.properties[x].description.toLowerCase().contains("url");
			return out;
		    }).bind(this));

		    if (++this.VueDemo.retrievedResources == this.VueDemo.resources.length) {
			this.ViewModels.columns = new Vue({
			    el: "#columns",
			    data: { resources: this.VueDemo.resources },
			    methods: this.VueDemo.columnViewMethods
			});
			
			$("#please-wait").fadeOut(250, function() {
			    $("#controls").fadeIn(250);
			});
			
			$("#btnGet").prop("disabled", false);
		    }
		}.bind(this) }.bind(this)(resource)
	    });
	}
    }


    /**
     * Loads and renders a page of entities
     *
     * @param page {number}		The page number to load
     */
    loadEntities(page="") {
	let resource = this.getSelectedResource();
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
		
		response.page = this.VueDemo.page;
		
		this.ViewModels.table = new Vue({
		    el: '#table',
		    data: {
			pageStart: (this.VueDemo.page - 1) * 10 + 1,
			pageEnd: (this.VueDemo.page - 1) * 10 + response.results.length,
			count: response.count,
			resource: resource,
			results: response.results,
			linkStore: this.VueDemo.linkStore
		    },
		    methods: this.VueDemo.entityViewMethods
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
	
	let resource = this.VueDemo.resources.find(x => x.name == resourceName);
	if (!resource)
	    return;
	
	let columns = resource.columns;
	
	$.ajax({
	    type: "GET",
	    url: url,
	    success: function(result) {
		$("#rest").append(this.clone($("#table-popup-template"), true));
		
		new Vue({
		    el: "#table-popup",
		    data: {
			columns,
			result,
			linkStore: this.VueDemo.linkStore
		    },
		    methods: this.VueDemo.entityPopupViewMethods
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
	    
	    if (this.VueDemo.waiting[url]) {
		--count;
		return;
	    } else if (this.VueDemo.linkStore[url]) {
		$(`[href='${url}']`)
		    .text(this.VueDemo.linkStore[url])
		    .removeClass("not-set");
		--count;
		return;
	    }
	    
	    this.VueDemo.waiting[url] = true;
	    
	    $.ajax({
		type: "GET",
		url: url,
		success: function(response) {
		    let name = response.name || response.title;
		    $(`[href='${url}']`)
			.text(name)
			.removeClass("not-set");
		    this.VueDemo.linkStore[url] = name;
		    
		    if (--count == 0) {
			this.saveLinkStore();
			console.log("Done.");
		    }
		}.bind(this)
	    });
	}).bind(this));
    }
}
