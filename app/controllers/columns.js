import { Controller } from "controllers/controller.js";
import { LocalStorage } from "local-storage.js";
import { Ajax } from "ajax.js";
import { cloneTemplate, mapName, reorder } from "utils.js";

export class ColumnsController extends Controller {
    constructor(base) {
	super(base);

	this.retrievedResources = 0;
	this.dragging = null;

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
	    // Initiate call
	    this.ajax.call(`${resource.name}/schema`)
	    .then((resource => { return response => {
		let columnFilter = this.loadFilter(resource);

		// Decorate columns list with these properties:
		//
		// displayName    A user-friendly version of the column name
		// index          The column's index in the list
		// show           True if this column is currently visible
		// hasUrl         True if this column contains URLs
		resource.columns = Object.keys(response.properties).map((x, i) => {
		    let out = mapName(x);
		    out.show = !columnFilter || !!columnFilter[out.name];
		    out.hasUrl = response.properties[x].description.toLowerCase().contains("url");
		    return out;
		});

		// Retrieve column order from local storage and reorder if found
		resource.defaultOrder = resource.columns.map(x => x.name);
		resource.order = LocalStorage.load(resource.name + ".order");
		if (resource.order) {
		    resource.columns = reorder(resource.columns, resource.defaultOrder, resource.order);
		} else {
		    resource.order = resource.defaultOrder;
		}

		// If we've done the last resource, fill and display the column filter view
		if (++this.retrievedResources == resources.length) {
		    this.viewmodel = new Vue({
			el: "#columnFilter",
			
			data: { resources },
			
			methods: {
			    showColumns: this.showColumns,
			    saveFilter: this.saveFilter
			}
		    });

		    $("#please-wait").animate({ top: -32 }, 350, "swing", function() {
			$("#controls").slideDown(350);
			this.setupDragAndDropEvents();
		    }.bind(this));

		    $("#btnGet").prop("disabled", false);
		}
	    } })(resource));
	}

	if (after)
	    after();
    }


    /**
     * Displays the columns page for the currently selected resource in the column filter
     */
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


    loadFilter(resource) {
	return LocalStorage.load(resource.name + ".show");
    }


    saveFilter(resource) {
	let filter = {};
	for (let column of resource.columns) {
	    filter[column.name] = column.show;
	}
	LocalStorage.save(`${resource.name}.show`, filter);
    }


    setupDragAndDropEvents() {
	$(".columnContainer label")
	    .on("mousedown", e => {
		e.originalEvent.target.classList.add("dragging");
		this.dragging = e.target;
	    })
	    .on("mouseup", e => {
		this.dragging.classList.remove("dragging");
		this.dragging = null;
	    })
	    .on("dragstart", e => {
		e.originalEvent.dataTransfer.setDragImage(document.createElement("img"), 0, 0);
	    })
	    .on("dragend", e => {
		this.dragging.classList.remove("dragging");
		this.dragging = null;

		// Set new column order
		let resource = this.getSelectedResource();
		let oldOrder = resource.order;
		resource.order = this.getColumnOrder();
		
		// Reorder columns and save column order
		resource.columns = reorder(resource.columns, oldOrder, resource.order);
		LocalStorage.save(resource.name + ".order", resource.order);
	    });
	
	$(".columnContainer").on("dragover", e => {
	    // Search up the DOM from our target for a <label> element whose parent has class columnContainer
	    
	    let target = e.originalEvent.target;
	    let parent = target.parentElement;
	    while (parent && !target.tagName === "LABEL") {
		target = parent;
		parent = target.parentElement;
	    }

	    if (parent.classList.contains("columnContainer")) {
		e.preventDefault();

		let halfHeight = target.clientHeight / 2;
		let above = e.offsetY < halfHeight;
		let sibling = above ? target : target.nextSibling;
		parent.insertBefore(this.dragging, sibling);
	    }
	});

    }


    getColumnOrder() {
	let $page = this.getSelectedPage();
	return Array.from($page.find("input")).map((elt, idx) => elt.getAttribute("name"));
    }
    

    getPageNumber() {
	return parseInt($("#columnFilter .columnName.selected").attr("data-index"));
    }


    getSelectedPage() {
	let page = this.getPageNumber();

	return $(`#columnFilter .columnPage[data-index='${page}']`);
    }
    

    getSelectedResource() {
	let page = this.getPageNumber();
	
	return $VueDemo.default.resources.model.store[page];
    }
}
